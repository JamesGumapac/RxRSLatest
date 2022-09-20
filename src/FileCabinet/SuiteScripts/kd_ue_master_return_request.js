/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*
* mrr - master return request
* rr - return request
*/
define(['N/record', 'N/search', 'N/file', 'N/error', 'N/url', 'N/redirect', 'N/runtime', 'N/task'],
function(record, search, file, error, url, redirect, runtime, task) {
    var SEA_MRR_RMA_INVOICE = 'customsearchkdl_mrr_rma_invc';
    var SCR_FILE_NAME_CS_MRR = 'kd_cs_master_return.js';
    var SCRIPT_GEN_IT_RQSTD_PDF = 'customscript_kd_sl_gen_items_req_pdf';
    var DEPLYMNT_GEN_IT_RQSTD_PDF = 'customdeploy_kd_sl_gen_items_req_pdf';
    var REC_RET_REQ = 'customsale_kod_returnrequest';
    var REC_MRR = 'customrecord_kod_masterreturn';
    var FLD_RET_REQ_IT_PROCESSING = 'custcol_kod_rqstprocesing';
    //var FLD_RMA_RET_REQ =  'custbody_kd_return_request';
    var FLD_TRAN_RET_REQ = 'custbody_kd_return_request';
    var FLD_TRAN_MRR = 'custbody_kd_master_return_id';
    var FLD_MRR_STATUS = 'custrecord_kod_mr_status';
    var FOLDER_MRR = 809;
    var FOLDER_RX_OTC = 811;
    var FOLDER_C3_5 = 812;
    var FOLDER_C2 = 810;
    var PROCESSING_DESTRUCTION = 1;
    var PROCESSING_RETURN_FOR_CREDIT = 2;
    var rrId, returnRequestRec;
    var rmaIds = [], invoiceIds = [];

    function _getSublistValue(objRec, sublistId, fieldId, line){
        return objRec.getSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            line: line
        });
    }
    function _setCurrentSublistValue(objRec, sublistId, fieldId, value){
        return objRec.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            value: value,
            ignoreFieldChange: false
        });
    }
    function getRmaInvoiceList(mrrId){
        var rmaSearch = search.load(SEA_MRR_RMA_INVOICE);
        rmaSearch.filters.push(search.createFilter({
            name: FLD_TRAN_MRR,
            join: FLD_TRAN_RET_REQ,
            operator: search.Operator.ANYOF,
            values: mrrId
        }));

        var searchRs = rmaSearch.run();
        var rs = searchRs.getRange(0, 1000);
        
        for(var i = 0; i < rs.length; i++){
            log.debug('getRmaInvoiceList', 'type: ' + rs[i].getValue({name: 'type', summary: search.Summary.GROUP}));
            if(rs[i].getValue({name: 'type', summary: search.Summary.GROUP}).toUpperCase() == 'RTNAUTH'){
                rmaIds.push(rs[i].getValue({name: 'internalid', summary: search.Summary.GROUP}));
            }else if(rs[i].getValue({name: 'type', summary: search.Summary.GROUP}).toUpperCase() == 'CUSTINVC'){
                invoiceIds.push(rs[i].getValue({name: 'internalid', summary: search.Summary.GROUP}));
            }
        }
    }
    function createCreditMemo(rmaId){
        var cmRec = record.transform({
            fromType: record.Type.RETURN_AUTHORIZATION,
            fromId: rmaId,
            toType: record.Type.CREDIT_MEMO,
            isDynamic: true,
        });

        rrId = cmRec.getValue(FLD_TRAN_RET_REQ);
        returnRequestRec = record.load({
            type: REC_RET_REQ,
            id: rrId,
            isDynamic: false,
        });
        for(var i = 0; i < returnRequestRec.getLineCount('item'); i++){
           if(_getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_PROCESSING, i) == PROCESSING_DESTRUCTION){
               cmRec.selectLine({
                   sublistId: 'item',
                   line: i
               });
               
               cmRec.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'amount',
                   value: 0,
                   ignoreFieldChange: false
               });
               log.debug('createCreditMemo', 'Set line ' + i + ' amount to 0')
               cmRec.commitLine('item');
           }
       }

        cmRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('createCreditMemo', 'Credit Memo ID: ' + cmRec.id);
      //update return package credit memo 
      updatePackage(cmRec.getValue('custbody_kd_return_request'),cmRec.id)
    }
  
    function updateInvoice(invoiceId){
        record.submitFields({
            type: record.Type.INVOICE,
            id: invoiceId,
            values: {
                approvalstatus: 2
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
            }
        });
    }     
  //update return package credit memo 
          function updatePackage(rrId,cmId) {
            var RETURN_PACKAGE_SEARCH = 'customsearch_kd_package_return_search'

            var packageSearchObj = search.load({
                id: RETURN_PACKAGE_SEARCH
            });
            packageSearchObj.filters.push(search.createFilter({
                name: "custrecord_kod_packrtn_rtnrequest",
                operator: 'anyof',
                values: rrId
            }))
            log.debug('Package OBJ', JSON.stringify(packageSearchObj))
            packageSearchObj.run().each(function (result) {

                var returnPackageId = result.getValue({
                    name: 'internalid'
                });
                log.debug('Return Package Id ' + returnPackageId)
                var returnPackage = record.load({
                    type: 'customrecord_kod_mr_packages',
                    id: returnPackageId
                })

                returnPackage.setValue({
                    fieldId: 'custrecord_kod_packrcpt_creditmemo',
                    value: cmId
                })


                var RPid = returnPackage.save({ignoreMandatoryFields: true})
                log.debug({title: 'returnPackage', details: RPid})


                return true;
            });
        }
    function getCustomerFolder(customerName){
        log.debug('getCustomerFolder', 'customer: ' + customerName);
        var folderId = search.create({
            type: 'folder',
            filters: [
              ['name', 'is', customerName], 
              'and', 
              ['parent', 'anyof', [FOLDER_MRR]]
            ]
        }).run().getRange({ start: 0, end: 1 });

        var customerFolderId;
        if(folderId.length <= 0){
            var folder = record.create({ type: record.Type.FOLDER});
            folder.setValue({ fieldId: 'name',
                            value: customerName});
            folder.setValue({ fieldId: 'parent',
                            value: FOLDER_MRR}); 
            var folderId = folder.save();
            log.debug('getCustomerFolder', folderId);
            customerFolderId = folderId;
        }else{
            log.debug('getCustomerFolder', folderId[0].id);
            customerFolderId = folderId[0].id;
        }
        return customerFolderId;
    }
    function getCustomerMrrFolder(mrrName, customerFolder){
        log.debug('getCustomerMrrFolder', 'mrrName: ' + mrrName);
        var folderId = search.create({
            type: 'folder',
            filters: [
              ['name', 'is', mrrName], 
              'and', 
              ['parent', 'anyof', [customerFolder]]
            ]
        }).run().getRange({ start: 0, end: 1 });

        var customerMrrFolderId;
        if(folderId.length <= 0){
            var folder = record.create({ type: record.Type.FOLDER});
            folder.setValue({ fieldId: 'name',
                            value: mrrName});
            folder.setValue({ fieldId: 'parent',
                            value: customerFolder}); 
            var folderId = folder.save();
            log.debug('getCustomerMrrFolder', folderId);
            customerMrrFolderId = folderId;
        }else{
            log.debug('getCustomerMrrFolder', folderId[0].id);
            customerMrrFolderId = folderId[0].id;
        }
        return customerMrrFolderId;
    }
    function getCategoryFolderId(folderName, categoryFolderName){
        log.debug('getCategoryFolderId', 'folderName: ' + folderName + '; categoryFolderName: ' + categoryFolderName);
        var folderIdRs = search.create({
            type: 'folder',
            filters: [
              ['name', 'is', categoryFolderName], 
              'and', 
              ['parent', 'anyof', [folderName]]
            ]
        }).run().getRange({ start: 0, end: 1 });

        var folderId;
        if(folderIdRs.length <= 0){
            var folder = record.create({
                type: record.Type.FOLDER
            });
            folder.setValue({ 
                fieldId: 'name',
                value: categoryFolderName 
            });
            folder.setValue({
                fieldId: 'parent',
                value: folderName
            }); 
            var folderId = folder.save();
            log.debug('getCategoryFolderId', 'created folder: ' + JSON.stringify(folderId));
            log.debug('getCategoryFolderId', 'created folder: ' + folderId);
            folderId = folderId;
        }else{
            log.debug('getCategoryFolderId', 'returned folder id from search: ' + folderIdRs[0].id);
            folderId = folderIdRs[0].id;
        }
        return folderId;
    }
    function moveFile(returnFile, customerFolder, fileSuffix){
        log.debug('moveFile', returnFile);
        var fileObj = file.load({
            id: returnFile 
        });
        log.debug('moveFile', 'folderId: ' + customerFolder)
        fileObj.folder = customerFolder; 
        var fileNameArr = fileObj.name.split('.');
        var fileName = fileNameArr[0];
        log.debug('moveFile', 'fileName: ' + fileName);
        for(var i = 1; i < fileNameArr.length-1; i++){
            fileName = fileName + '.' + fileNameArr[i];
        }
        log.debug('moveFile', 'fileName: ' + fileName);
        fileName = fileName + '_' + fileSuffix + '.' + fileNameArr[fileNameArr.length-1];
        log.debug('moveFile', 'fileSuffix: ' + fileSuffix);
        log.debug('moveFile', 'fileName: ' + fileName);
        fileObj.name = fileName; 
        var fileId = fileObj.save();
        log.debug('TEST', 'file id saved: ' + fileId)
        return fileId;
    }
    function beforeLoad(context){
        if(context.type == 'create'){
            var mrrIdRs = search.load('customsearch_kd_mrr_latest_id').run().getRange({ start: 0, end: 1 });
            log.debug('beforeLoad', JSON.stringify(mrrIdRs[0].getValue({name: 'internalid', summary: search.Summary.MAX})));
            var mrrName = 'MRR' + (parseInt(mrrIdRs[0].getValue({
                name: 'internalid',
                summary: search.Summary.MAX
            })) + parseInt(1));
            log.debug('beforeLoad', mrrName);
            context.newRecord.setValue({
                fieldId: 'name',
                value: mrrName
            });
            log.debug('beforeLoad', 'set the name');
        }else if(context.type == 'view'){
            var generatePdfUrl = url.resolveScript({
                scriptId: SCRIPT_GEN_IT_RQSTD_PDF,
                deploymentId: DEPLYMNT_GEN_IT_RQSTD_PDF
            });
            
            generatePdfUrl += '&id=' + context.newRecord.id;

            context.form.addButton({
                id : 'custpage_btn_print_rir',
                label : 'Print Items Requested',
                functionName: "window.open('" + generatePdfUrl + "');"
            });

            var generateFinStatamentPdfUrl = url.resolveScript({
                scriptId: 'customscript_kd_sl_gen_final_statement',
                deploymentId: 'customdeploy_kd_sl_gen_final_statement'
            });
            
            generateFinStatamentPdfUrl += '&id=' + context.newRecord.id;

            /*context.form.addButton({
                id : 'custpage_btn_print_fin_statement',
                label : 'Print Final Statement',
                functionName: "window.open('" + generateFinStatamentPdfUrl + "');"
            });*/
            
          	/*log.debug('test', runtime.getCurrentUser().role + ' : ' + context.newRecord.getValue('custrecord_kd_ready_for_approval'))
            if((runtime.getCurrentUser().role == 3 || runtime.getCurrentUser().role == 1028) && context.newRecord.getValue('custrecord_kd_ready_for_approval') == true && context.newRecord.getValue('custrecord_kod_mr_status') != 10){
                //{custbody_kd_rr_category.id}=3 and {userrole.id} in (3,1028) and {custbody_kd_c2_no_of_labels} is not null
                context.form.addButton({
                    id : 'custpage_btn_approve',
                    label : 'Approve',
                    functionName: "approve"
                });
                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_MRR]
                    ]
                }).run().getRange({ start: 0, end: 1 });
                log.debug('beforeLoad', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
            }*/

            if((runtime.getCurrentUser().role == 3 || runtime.getCurrentUser().role == 1028) && context.newRecord.getValue('custrecord_kd_mrr_final_statement') == '' && context.newRecord.getValue('custrecord_kod_mr_status') == 10){
                context.form.addButton({
                    id : 'custpage_btn_print_fin_statement',
                    label : 'Print Final Statement',
                    functionName: "generateFinalStatement"
                });
                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_MRR]
                    ]
                }).run().getRange({ start: 0, end: 1 });
                log.debug('beforeLoad', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
            }
        }
    }
    function beforeSubmit(context){
        if (context.type == context.UserEventType.DELETE)
            return;

        var mrrSearch = search.create({
            type: REC_MRR,
            columns: [{
                name: 'internalid'
            }],
            filters: [{
                name: 'name',
                operator: 'is',
                values: [context.newRecord.getValue('name')]
            }]
        });
        if(context.type == context.UserEventType.EDIT){
            mrrSearch.filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.NONEOF,
                values: context.newRecord.id
            }));
        }
        if(mrrSearch.run().getRange({ start: 0, end: 1 }).length > 0){
            throw error.create({
                name: 'ERR_MRR_EXISTS', 
                message: 'Master Return Record ' + context.newRecord.getValue('name') + ' already exists. Please set a different name.',
                notifyOff: false
            }).message;
        }
        //TMP FOR TEST OF INVOICE CREATION
        //createPharmacyInvoice(context.newRecord.id);
        //END TMP FOR TEST;
        return;
    }
    function anotherDeploymentIsExecuting() {
        var ss = search.create({
            type:		record.Type.SCHEDULED_SCRIPT_INSTANCE,
            filters:    [
                            ["status","anyof","PENDING","PROCESSING","RESTART","RETRY"]
                            ,"AND",
                            ["script.scriptid",search.Operator.IS,'customscript_kd_mr_create_item_requested']//["script.scriptid",search.Operator.IS,runtime.getCurrentScript().id]
                            ,"AND",
                            ["scriptDeployment.scriptid",search.Operator.ISNOT,runtime.getCurrentScript().deploymentId]//["scriptDeployment.scriptid",search.Operator.ISNOT,runtime.getCurrentScript().deploymentId]
                        ],
              columns:	["status", "script.internalid"]
        }).run().getRange(0,1);
        return (ss.length > 0);
    }
    function createPharmacyInvoice(mrrId) {
        log.debug('createPharmacyInvoice', 1);
        var invcRec = record.create({
            type: record.Type.INVOICE,
            isDynamic: true
        });
        var returnRequestRec = record.load({
            type: REC_RET_REQ,
            id: 10335,
            isDynamic: false,
        });
        log.debug('createPharmacyInvoice', 2);
        invcRec.setValue('entity', returnRequestRec.getValue('entity'));
        log.debug('createPharmacyInvoice', 3);
        invcRec.setValue('custbody_kd_return_request', returnRequestRec.id);
        log.debug('createPharmacyInvoice', 4);
        invcRec.setValue('location', returnRequestRec.getValue('location'));
        log.debug('createPharmacyInvoice', 5);
        invcRec.setValue('approvalstatus', '1');

        var item, qty, rate, amount, processing, priceLevel;
        
        for(var i = 0; i < returnRequestRec.getLineCount('item'); i++){
            item = _getSublistValue(returnRequestRec, 'item', 'item', i);
            qty = _getSublistValue(returnRequestRec, 'item', 'quantity', i);
            rate = _getSublistValue(returnRequestRec, 'item', 'rate', i);
            amount = _getSublistValue(returnRequestRec, 'item', 'amount', i);
            fullpartial = _getSublistValue(returnRequestRec, 'item', 'custcol_kod_fullpartial', i);
            log.debug('createPharmacyInvoice', 'item: ' + item + '; qty: ' + qty + ';rate: ' + rate + '; amount:' + amount + '; fullpartial:' + fullpartial);
            var hasNonRetunable = true;
            invcRec.selectNewLine({
                sublistId: 'item'
            });

            _setCurrentSublistValue(invcRec, 'item', 'item', item, true);
            _setCurrentSublistValue(invcRec, 'item', 'quantity', qty, true);
            _setCurrentSublistValue(invcRec, 'item', 'custcol_kod_fullpartial', fullpartial, true);
            _setCurrentSublistValue(invcRec, 'item', 'price', '-1', true);
            _setCurrentSublistValue(invcRec, 'item', 'rate', rate, true);
            _setCurrentSublistValue(invcRec, 'item', 'amount', amount, true);
            _setCurrentSublistValue(invcRec, 'item', 'location', invcRec.getValue('location'), true);

            log.debug('createPharmacyInvoice', 'item qty: ' + invcRec.getCurrentSublistValue('item', 'quantity'));
            var returnReqSubrec = returnRequestRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: i
            });
            log.debug('test', 'subrecord line count: ' + returnReqSubrec.getLineCount('inventoryassignment'));
            var subrecordCount = returnReqSubrec.getLineCount('inventoryassignment');
            var invSubRec = invcRec.getCurrentSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail'
            });
            for (var subrecIndx = 0; subrecIndx < subrecordCount; subrecIndx++) {
                log.debug('createPharmacyInvoice', 'subrecord invnum: ' + returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'numberedrecordid',
                    line: subrecIndx
                }));
                log.debug('createPharmacyInvoice', 'subrecord quantity: ' + returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    line: subrecIndx
                }));
                log.debug('createPharmacyInvoice', 'subrecord expirationdate: ' + returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'expirationdate',
                    line: subrecIndx
                }));

                subRecNum = returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'numberedrecordid',
                    line: subrecIndx
                });

                subRecQty = returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    line: subrecIndx
                });

                subRecExpDate = returnReqSubrec.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'expirationdate',
                    line: subrecIndx
                });

                invSubRec.selectNewLine({
                    sublistId: 'inventoryassignment',
                });

                invSubRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: subRecQty
                });

                invSubRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber',
                    value: subRecNum
                });

                invSubRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'expirationdate',
                    value: subRecExpDate
                });

                invSubRec.commitLine({
                    sublistId: 'inventoryassignment'
                });
            }

            invcRec.commitLine('item');
        }

        var invcId = invcRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('test', 'INVOICE ID: ' + invcId)
    }
    function afterSubmit(context) {
        var mrrOldRec = context.oldRecord;
        var mrrRec = context.newRecord;
        log.debug('afterSubmit', 'STATUS IS ' + mrrRec.getValue(FLD_MRR_STATUS));
        if(mrrRec.getValue(FLD_MRR_STATUS) != '' && mrrRec.getValue(FLD_MRR_STATUS) != 10){
            //if(mrrRec.getText(FLD_MRR_STATUS).toUpperCase() != 'APPROVED'){
                var rxOtcFile = mrrRec.getValue('custrecord_kd_mrr_rx_otc_file');
                var c35File = mrrRec.getValue('custrecord_kd_mrr_c3_5_file');
                var c2File = mrrRec.getValue('custrecord_kd_mrr_c2_file');
                
                var lookupRs = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id:  mrrRec.getValue('custrecord_kod_customer'),
                    columns: ['altname']
                }); 
                
                log.debug('afterSubmit', JSON.stringify(lookupRs));
                var customerName = lookupRs.altname;
                var customerFolder = getCustomerFolder(customerName);
                var customerMrrFolder = getCustomerMrrFolder(mrrRec.getValue('name'), customerFolder);
                log.debug('afterSubmit', 'rx file: ' + rxOtcFile + '; c3-5 file: ' + c35File + '; c2 file: ' + c2File);
                var rxOtcFileId, c35FileId, c2FileId;
                var isNewRxOtcFile, isNewC35File, isNewC2File;
                if(rxOtcFile != ''){
                    if(mrrOldRec != null){
                        log.debug('TEST', 'Old RX File: ' + mrrOldRec.getValue('custrecord_kd_mrr_rx_otc_file') + '; New Rx File: ' + mrrRec.getValue('custrecord_kd_mrr_rx_otc_file'));
                        if(mrrOldRec.getValue('custrecord_kd_mrr_rx_otc_file') != mrrRec.getValue('custrecord_kd_mrr_rx_otc_file')){
                            rxOtcFileId = moveFile(rxOtcFile, customerMrrFolder, 'RX');
                        }
                    }else{
                        moveFile(rxOtcFile, customerMrrFolder, 'RX');
                    }
                }

                if(c35File != ''){
                    if(mrrOldRec != null){
                        log.debug('TEST', 'Old C35 File: ' + mrrOldRec.getValue('custrecord_kd_mrr_c3_5_file') + '; New C35 File: ' + mrrRec.getValue('custrecord_kd_mrr_c3_5_file'));
                        if(mrrOldRec.getValue('custrecord_kd_mrr_c3_5_file') != mrrRec.getValue('custrecord_kd_mrr_c3_5_file')){
                            c35FileId = moveFile(c35File, customerMrrFolder, 'C3-5');
                        }
                    }else{
                        moveFile(c35File, customerMrrFolder, 'C3-5');
                    }
                }

                if(c2File != ''){
                    if(mrrOldRec != null){
                        log.debug('TEST', 'Old C2 File: ' + mrrOldRec.getValue('custrecord_kd_mrr_c2_file') + '; New C2 File: ' + mrrRec.getValue('custrecord_kd_mrr_c2_file'));
                        if(mrrOldRec.getValue('custrecord_kd_mrr_c2_file') != mrrRec.getValue('custrecord_kd_mrr_c2_file')){
                            c2FileId = moveFile(c2File, customerMrrFolder, 'C2');
                        }
                    }else{
                        moveFile(c2File, customerMrrFolder, 'C2');
                    }
                }

                //if(context.type == 'create'){
                    /*record.submitFields({
                        type: REC_MRR,
                        id: mrrRec.id,
                        values: {
                            custrecord_kd_mrr_for_csv_import: true
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
                    try{
                        var mrTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_kd_mr_create_item_requested',
                            deploymentId: 'customdeploy_kd_mr_create_it_requested'
                        });
                        var mrTaskId = mrTask.submit();
                        var mrTaskStatus = task.checkStatus({
                            taskId: mrTaskId
                        });
                        log.debug('TEST', 'MR Task Status ' + mrTaskStatus);
                        //if(mrTaskStatus == FAILED)
                    }catch(ex){
                        log.error({title: 'map/reduce task creation', details: ex });
                    }*/
                /*}else if(context.type == 'edit'){
                    var objMrrRec;
                    if(rxOtcFileId != null || c35FileId != null || c2FileId != null){
                        var objRecord = record.load({
                            type: REC_MRR,
                            id: mrrRec.id
                        });

                        objRecord.setValue({
                            fieldId: 'custrecord_kd_mrr_rx_otc_file',
                            value: rxOtcFileId
                        });

                        objRecord.setValue({
                            fieldId: 'custrecord_kd_mrr_c3_5_file',
                            value: c35FileId
                        });

                        objRecord.setValue({
                            fieldId: 'custrecord_kd_mrr_c2_file',
                            value: c2FileId
                        });
                    }
                }*/
            //}
        }
        
        log.debug('afterSubmit', 'MRR ID: ' + mrrRec.id);
        if(mrrOldRec != null){
            if(mrrRec.getValue(FLD_MRR_STATUS) != mrrOldRec.getValue(FLD_MRR_STATUS) && mrrRec.getText(FLD_MRR_STATUS).toUpperCase() == 'APPROVED'){
            //if(mrrRec.getText(FLD_MRR_STATUS).toUpperCase() == 'APPROVED'){
                createPharmacyInvoice(mrrRec.id);
                log.debug('afterSubmit', 'MRR ID: ' + mrrRec.id);
                
                getRmaInvoiceList(mrrRec.id);
                log.debug('afterSubmit', 'RMA IDs: ' + JSON.stringify(rmaIds));
                for(var i = 0; i < rmaIds.length; i++){
                    createCreditMemo(rmaIds[i]);
                }
                for(var i = 0; i < invoiceIds.length; i++){
                    updateInvoice(invoiceIds[i]);
                }

                //generate final statement
                /*var generatePdfUrl = url.resolveScript({
                    scriptId: 'SCR_ID_GENERATE_FORM_222',
                    deploymentId: DPLYMNT_GENERATE_FORM_222
                });
                log.debug('afterSubmit', generatePdfUrl);
                redirect.redirect({
                    url: generatePdfUrl+'&id='+context.newRecord.id
                });*/

                var generateFinStatamentPdfUrl = url.resolveScript({
                    scriptId: 'customscript_kd_sl_gen_final_statement',
                    deploymentId: 'customdeploy_kd_sl_gen_final_statement'
                });
                
                generateFinStatamentPdfUrl += '&id=' + context.newRecord.id;
              log.debug('afterSubmit', 'generateFinalStatementPdfUrl> ' + generateFinStatamentPdfUrl);
                /*redirect.redirect({
                    url: generateFinStatamentPdfUrl
                });*/
              redirect.toSuitelet({
                  scriptId: '630',
                  deploymentId: '882',
                  parameters: {
                      'custscript_kd_mrr_id': context.newRecord.id
                  }
              });
            }
        }
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});