/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/ui/serverWidget', 'N/url', 'N/ui/message'],
    function(record, search, runtime, serverWidget, url, message) {
        var SEA_RETURN_ITEM_RQSTD = 'customsearch_kd_return_item_requested';
        var REC_FORM_222_REF_NUM = 'customrecord_kd_222formrefnum';
        var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
        var FLD_RIR_FORM_222_REF_NO = 'custrecord_kd_rir_form222_ref';
        var FLD_F2RN_PAGE = 'custrecord_kd_form222_page';
        var FLD_F2RN_RET_REQ = 'custrecord_kd_returnrequest';
        var FLD_F2RN_PAGE = 'custrecord_kd_form222_page';
        var form222Count = 0;
        function updateReturnRequestForm222(rrId){
            var customrecord_kd_222formrefnumSearchObj = search.create({
                type: "customrecord_kd_222formrefnum",
                filters:
                    [
                        ["custrecord_kd_returnrequest","anyof",rrId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "id", label: "ID"}),
                        search.createColumn({name: "scriptid", label: "Script ID"})
                    ]
            });
            var searchResultCount = customrecord_kd_222formrefnumSearchObj.runPaged().count;
            log.debug('updateReturnRequestForm222 searchResultCount', searchResultCount);
            if(searchResultCount){
                var rrRecId = record.submitFields({
                    type:'customsale_kod_returnrequest',
                    id: rrId,
                    values:{
                        'custbody_kd_no_form_222' : searchResultCount
                    }
                })
                log.debug('updateReturnRequestForm222','Updating RR ' +rrId+ ' form 222 Fields')
            }
        }
        function updateTask(rrId){
            log.debug('RRID' ,rrId)
            var taskId;
            var taskRec;
            var taskSearchObj = search.create({
                type: "task",
                filters:
                    [
                        ["custevent_kd_ret_req","anyof",rrId]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "internalid"}),
                    ]
            });
            var searchResultCount = taskSearchObj.runPaged().count;
            log.debug("taskSearchObj result count",searchResultCount);
            taskSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                taskId = result.getValue({name: 'internalid'})
                return true;
            });
            if(taskId) {
                taskRec = record.load({
                    type: "task",
                    id: taskId,
                    isDynamic: true
                })
                log.debug('taskrec' , JSON.stringify(taskRec))
            }
            var all222FormFileSearch = search.load({
                id: 'customsearch_kd_222_form_file_search_2'
            })
            all222FormFileSearch.filters.push(search.createFilter({
                name:'custrecord_kd_returnrequest',
                operator: 'anyof',
                values: rrId
            }));
            var searchResultCount = 0
            var form222FileCount = 0;
            all222FormFileSearch.run().each(function(result){
                form222FileCount = result.getValue({
                    name: 'custrecord_kd_2frn_222_form_pdf',
                    summary: "COUNT"
                })
                searchResultCount = result.getValue({
                    name: 'id',
                    summary: "COUNT"
                })
                return true;
            });
            log.debug('Search Result Count ', searchResultCount )
            log.debug('222 Form File Count', form222FileCount)
            if(searchResultCount != form222FileCount){
                taskRec.setValue({fieldId: 'custevent_kd_222_form_generated', value: false})
            }
            var taskIdRec = taskRec.save({ignoreMandatoryFields: true})
            log.debug('Task rec has been update ',taskIdRec)
        }
        function get222FormCurrentPage(rrId){
            var f2rnSearch = search.create({
                type: REC_FORM_222_REF_NUM,
                columns: [search.createColumn({
                    name: 'internalid',
                    summary: search.Summary.COUNT
                })],
                filters: [{
                    name: FLD_F2RN_RET_REQ,
                    operator: 'anyof',
                    values: [rrId]
                }]
            });
            var rs = f2rnSearch.run().getRange(0,1);
            var f2rnCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
            return f2rnCount;
        }
        function getItemsRequested(rrId, f2rnId) {
            var objSearch = search.load({
                id: SEA_RETURN_ITEM_RQSTD
            });
            objSearch.filters.push(search.createFilter({
                name: 'custrecord_kd_rir_return_request',
                operator: search.Operator.ANYOF,
                values: rrId
            }));
            objSearch.filters.push(search.createFilter({
                name: 'custrecord_kd_rir_form222_ref',
                operator: search.Operator.ANYOF,
                values: f2rnId
            }));
            var searchRs = objSearch.run().getRange({start: 0, end: 1000});
            var itemsRequested = [];
            var rirId, item, displayName, itemNdc, qty, fulPar, form222No, form222RefNo;
            log.debug('getItemsRequested', 'searchRs: ' + JSON.stringify(searchRs));

            for (var i = 0; i < searchRs.length; i++) {
                rirId = searchRs[i].getValue({
                    name: 'id'
                });
                item = searchRs[i].getValue({
                    name: 'custrecord_kd_rir_item'
                });
                displayName = searchRs[i].getValue({
                    name: 'displayname',
                    join: 'custrecord_kd_rir_item'
                });
                if (displayName == '') {
                    displayName = searchRs[i].getText({
                        name: 'custrecord_kd_rir_item'
                    });
                }
                itemNdc = searchRs[i].getValue({
                    name: 'custitem_kod_item_ndc',
                    join: 'custrecord_kd_rir_item'
                });
                qty = searchRs[i].getValue({
                    name: 'custrecord_kd_rir_quantity'
                });
                fulPar = searchRs[i].getValue({
                    name: 'custrecord_kd_rir_fulpar'
                });
                form222No = searchRs[i].getValue({
                    name: 'custrecord_kd_rir_form_222_no'
                });
                form222RefNo = searchRs[i].getText({
                    name: 'custrecord_kd_rir_form222_ref'
                });

                itemsRequested.push({
                    id: rirId,
                    item: item,
                    displayname: displayName,
                    ndc: itemNdc,
                    qty: qty,
                    fulpar: fulPar,
                    form222No: form222No,
                    form222RefNo: form222RefNo
                });
            }

            log.debug('getItemsRequested', 'object generated: ' + JSON.stringify(itemsRequested));
            return itemsRequested;
        }
        function addItemsRequestedSublist(context) {
            if(context.newRecord.getValue('FLD_F2RN_RET_REQ') == '')
                return;

            context.form.addTab({
                id: 'custpage_tab_items_requested',
                label: 'Items Requested'
            });
            log.debug('addItemsRequestedSublist', 'Added Items Requested tab')

            var objSublist = context.form.addSublist({
                id: 'custpage_sublist_items_requested',
                type: serverWidget.SublistType.LIST,
                label: 'Items Requested',
                tab: 'custpage_tab_items_requested'
            });
            objSublist.addField({
                id: 'custpage_edit',
                type: serverWidget.FieldType.TEXT,
                label: 'Edit'
            });
            objSublist.addField({
                id: 'custpage_col_id',
                label: 'ID',
                type: serverWidget.FieldType.SELECT,
                source: 'customrecord_kod_mr_item_request'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item',
                label: 'Item',
                type: serverWidget.FieldType.SELECT,
                source: 'item'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_description',
                label: 'Item Description',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_ndc',
                label: 'Item NDC',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_qty',
                label: 'Quantity',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_ful_par',
                label: 'Full/Partial',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist_kod_fullpartial'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_form_222_no',
                label: 'Form 222 No.',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            objSublist.addField({
                id: 'custpage_col_item_form_222_ref_no',
                label: 'Form 222 Ref No.',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
            var itemsRequested = getItemsRequested(context.newRecord.getValue(FLD_F2RN_RET_REQ), context.newRecord.id);
            log.debug('addItemsRequestedSublist', 'return request id: ' + context.newRecord.getValue(FLD_F2RN_RET_REQ));
            log.debug('addItemsRequestedSublist', 'itemsRequested: ' + JSON.stringify(itemsRequested));
            //var netsuiteSiteUrl = getDataCenterURL();
            var domain = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            //itemsRequested = itemsRequested[0];
            for (var i = 0; i < itemsRequested.length; i++) {
                log.debug('TEST HERE', i)
                var editUrl = url.resolveRecord({
                    recordType: 'customrecord_kod_mr_item_request',
                    recordId: itemsRequested[i].id,
                    isEditMode: true
                });
                var lineUrl = 'https://' + domain + editUrl;
                objSublist.setSublistValue({
                    id: 'custpage_edit',
                    line: i,
                    value: '<a href="' + lineUrl + '">EDIT</a>'
                });
                /*contacts.setSublistValue({
                    id: 'edit',
                    line: ctr,
                    value: 'https://' + domain + editUrl
                });*/
                /*objSublist.setSublistValue({
                    id: 'custpage_edit',
                    line: i,
                    value: 'https://' + domain + editUrl
                });*/
                objSublist.setSublistValue({
                    id: 'custpage_col_id',
                    value: itemsRequested[i].id,
                    line: i
                });
                objSublist.setSublistValue({
                    id: 'custpage_col_item',
                    value: itemsRequested[i].item,
                    line: i
                });
                objSublist.setSublistValue({
                    id: 'custpage_col_item_description',
                    value: itemsRequested[i].displayname,
                    line: i
                });
                objSublist.setSublistValue({
                    id: 'custpage_col_item_ndc',
                    value: itemsRequested[i].ndc,
                    line: i
                });
                if(itemsRequested[i].qty != ''){
                    objSublist.setSublistValue({
                        id: 'custpage_col_item_qty',
                        value: itemsRequested[i].qty,
                        line: i
                    });
                }
                objSublist.setSublistValue({
                    id: 'custpage_col_item_ful_par',
                    value: itemsRequested[i].fulpar,
                    line: i
                });
                if (itemsRequested[i].form222No != '') {
                    objSublist.setSublistValue({
                        id: 'custpage_col_item_form_222_no',
                        value: itemsRequested[i].form222No,
                        line: i
                    });
                }
                if (itemsRequested[i].form222RefNo != '') {
                    objSublist.setSublistValue({
                        id: 'custpage_col_item_form_222_ref_no',
                        value: itemsRequested[i].form222RefNo,
                        line: i
                    });
                }
            }
        }
        function beforeLoad(context){
            if(context.type != context.UserEventType.CREATE && context.type != context.UserEventType.COPY)
                addItemsRequestedSublist(context);

            var generate222FormLabel = 'Generate Form 222';
            if(context.newRecord.getValue('custrecord_kd_2frn_for_222_regeneration')){
                generate222FormLabel = 'Regenerate Form 222';
                context.form.addPageInitMessage({

                    title: '222 Form needs to be regenerated!',
                    message: 'Click on Regenerate Form 222 button.',
                    type: message.Type.WARNING,
                    //duration: 1500
                })
            }


            if(context.newRecord.getValue('name') != '000000000' && context.newRecord.getLineCount('custpage_sublist_items_requested') > 0 && (context.newRecord.getValue('custrecord_kd_2frn_222_form_pdf') == '' || context.newRecord.getValue('custrecord_kd_2frn_for_222_regeneration')) && context.type != context.UserEventType.CREATE && context.type != context.UserEventType.COPY&& context.type != context.UserEventType.EDIT){
                context.form.addButton({
                    id : 'custpage_btn_form222',
                    label : generate222FormLabel,
                    functionName: "generateForm222"
                });
            }

            var fileId = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', 'kd_cs_form_222_ref_num.js']
                ]
            }).run().getRange({ start: 0, end: 1 });
            log.debug('test', 'cs file id: ' + fileId[0].id);
            context.form.clientScriptFileId = fileId[0].id;

            if (context.type == context.UserEventType.CREATE && runtime.executionContext == 'USERINTERFACE'){// === runtime.ContextType.USERINTERFACE
                var rrId = context.request.parameters.custscript_rrid;
                if(rrId !== '' && rrId !== null && rrId !== undefined){
                    var pageNo = String(parseInt(get222FormCurrentPage(rrId)) + parseInt(1));
                    context.newRecord.setValue(FLD_F2RN_PAGE, pageNo);
                    context.newRecord.setValue(FLD_F2RN_RET_REQ, rrId);
                }
                context.newRecord.setValue('name', '000000000');
            }
        }
        function afterSubmit(context) {
            var form222Rec = context.newRecord;
            var rrId = form222Rec.getValue('custrecord_kd_returnrequest')
            log.debug('AfterSubmit','RRID ')
            if(rrId) {
                log.debug('afterSubmit','updating form 222 count')
                try {
                    updateReturnRequestForm222(rrId)
                } catch (e) {
                    log.error(e.message)
                }
            }

            if (context.type == context.UserEventType.EDIT){
                var f2rnId = context.newRecord.id;
                var newPageNo = context.newRecord.getValue(FLD_F2RN_PAGE);
                log.debug('afterSubmit', 'F2RN ID: ' + f2rnId);
                log.debug('afterSubmit', context.oldRecord.getValue(FLD_F2RN_PAGE) + ' : ' + newPageNo);
                if(context.oldRecord.getValue(FLD_F2RN_PAGE) != newPageNo){
                    var rirSearch = search.create({
                        type: REC_RETURN_ITEM_REQUESTED,
                        columns: [
                            search.createColumn({
                                name: 'internalid'
                            })
                        ],
                        filters: [{
                            name: FLD_RIR_FORM_222_REF_NO,
                            operator: 'anyof',
                            values: [f2rnId]
                        }]
                    });
                    var rs = rirSearch.run().getRange(0,1000);//only getting range 0 - 1000 because there is a control on how many RIR can only be assigned to a Form 222 Ref No.
                    log.debug('afterSubmit', 'rir to update count: ' + rs.length);
                    for(var i = 0; i < rs.length; i++){
                        var rirId = rs[i].getValue('internalid');
                        log.debug('afterSubmit', 'rir to update: ' + rirId);
                        record.submitFields({
                            type: REC_RETURN_ITEM_REQUESTED,
                            id: rirId,
                            values: {
                                'custrecord_kd_rir_form_222_no': newPageNo
                            },
                            enablesourcing: false,
                            ignoreMandatoryFields: true
                        });
                        log.debug('afterSubmit', 'Updated Page of RIR ' + rirId);
                    }
                }
            }
            var rec = context.newRecord
            var rrId = rec.getValue('custrecord_kd_returnrequest')
            if(rrId){
                updateTask(rrId)
            }


        }
        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };
    });