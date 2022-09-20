/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/task', 'N/file', 'N/format'],
function(runtime, search, record, task, file, format){
    var SEA_MRR_FOR_IMPORT = 'customsearch_kd_mrr_for_import';
    var REC_MRR = 'customrecord_kod_masterreturn';
    var MRR_FLD_RXOTC = 'custrecord_kd_rxotc';
    var MRR_FLD_C35 = 'custrecord_kd_c3to5';
    var MRR_FLD_C2 = 'custrecord_kd_c2';
    var MRR_FLD_RXOTC_FILE = 'custrecord_kd_mrr_rx_otc_file';
    var MRR_FLD_C35_FILE = 'custrecord_kd_mrr_c3_5_file';
    var MRR_FLD_C2_FILE = 'custrecord_kd_mrr_c2_file';
    var MRR_FLD_RX_OTC_IMPORTED = 'custrecord_rx_otc_imported';
    var MRR_FLD_C2_IMPORTED = 'custrecord_c2_imported';
    var MRR_FLD_C3_5_IMPORTED = 'custrecord_c3_5_imported';
    var MRR_FLD_RXOTC_RESULTS = 'custrecord_kd_mrr_rxotc_results';
    var MRR_FLD_C35_RESULTS = 'custrecord_kd_mrr_c35_results';
    var MRR_FLD_C2_RESULTS = 'custrecord_kd_mrr_c2_results';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var RIR_FLD_MRR_ID = 'custrecord_kd_rir_masterid';
    var RIR_FLD_LINE_ID = 'custrecord_kd_rir_lineid';
    var RIR_FLD_ITEM = 'custrecord_kd_rir_item';
    var RIR_FLD_QUANTITY = 'custrecord_kd_rir_quantity';
    var RIR_FLD_FULL_PARTIAL = 'custrecord_kd_rir_fulpar';
    var RIR_FLD_LOT_NUMBER = 'custrecord_kd_rir_lotnumber';
    var RIR_FLD_LOT_EXPIRATION = 'custrecord_kd_rir_lotexp';
    var RIR_FLD_FORM_222_NO = 'custrecord_kd_rir_form_222_no';
    var ITEM_FLD_NDC = 'custitem_kod_item_ndc';
    var SEA_ITEM_ID = 'customsearch_kd_item_id_and_category';
    var UNIDENTIFIED_RX_OTC_ITEM_ID = 626;
    var UNIDENTIFIED_C35_ITEM_ID = 627;
    var UNIDENTIFIED_C2_ITEM_ID = 628;
    var CATEGORY_RX_OTC = 1;
    var CATEGORY_C2 = 3;
    var CATEGORY_C3_5 = 4;
    //var RIR_FLD_ = 'custrecord_kd_rir_';

    function fileContentsToObj(fileContents){
        var arrContents = fileContents.split("\r\n");
        log.debug('fileContentsToObj', JSON.stringify(arrContents));
        var headers = arrContents[0].split(",");
        for(var i = 0; i < headers.length; i++){
            headers[i] = headers[i].trim();
        }
        log.debug('fileContentsToObj', '[HEADERS] ' + JSON.stringify(headers));
        var lines = [];
        var headerIndx;
        for(var i = 1; i < arrContents.length; i++){
            var lineContent = arrContents[i];
            var lineObj = {};
            var lineStr = '';
            var flag = 0;
            headerIndx = 0;

            for(var j = 0; j < lineContent.length; j++){
                var ch = lineContent[j];
                if(ch === '"' && flag === 0){
                    flag = 1;
                }else if(ch === '"' && flag == 1){
                    flag = 0;
                }

                if(ch === ',' && flag === 0){
                    lineObj[headers[headerIndx]] = lineStr.trim();
                    lineStr = '';
                    headerIndx++;
                }else if(ch !== '"'){
                    lineStr += ch;
                }

                if(lineStr != ''){
                    lineObj[headers[headerIndx]] = lineStr.trim();
                }
            }

            lines.push(lineObj);
        }

        log.debug('fileContentsToObj', 'lines: ' + JSON.stringify(lines));
        return lines;
    }
    function getItemId(itemNdc){
        var itemId = '';
        var itemIdSearch = search.load({
            id: SEA_ITEM_ID
        });

        itemIdSearch.filters.push(search.createFilter({
            name: ITEM_FLD_NDC,
            operator: search.Operator.IS,
            values: itemNdc
        }));
        /*itemIdSearch.filters.push(search.createFilter({
            name: 'itemid',
            operator: search.Operator.IS,
            values: itemNdc
        }));*/

        var rs = itemIdSearch.run().getRange({ start: 0, end: 1 });
        if(rs.length > 0){
            itemId = rs[0].id;
        }

        return itemId;
    }
    function getItemDetails(itemNdc){
        var itemDetails = {};
        var itemIdSearch = search.load({
            id: SEA_ITEM_ID
        });

        itemIdSearch.filters.push(search.createFilter({
            name: ITEM_FLD_NDC,
            operator: search.Operator.IS,
            values: itemNdc
        }));
        /*itemIdSearch.filters.push(search.createFilter({
            name: 'itemid',
            operator: search.Operator.IS,
            values: itemNdc
        }));*/

        var rs = itemIdSearch.run().getRange({ start: 0, end: 1 });
        if(rs.length > 0){
            log.debug('TEST getitemdetails', '1 ' + JSON.stringify(rs));
            itemDetails['id'] = rs[0].id;
            log.debug('TEST getitemdetails', '2');
            itemDetails['category'] = rs[0].getValue('custitem_kod_itemcontrol');
        }

        return itemDetails;
    }
    function createItemsRequested(objFile, category, mrrId, folderId){
        var resultsId = '';
        if(objFile.size < 10485760){
            var fileContents = objFile.getContents();
            var rawLines = fileContents.split("\r\n");
            var lines = fileContentsToObj(fileContents);
            var rirRec, line, itemDetails, itemId, itemCategory;
            var errorLines = '';
            var c2RirIds = [];
            var rrId = '';
            if(category == CATEGORY_C2){
                var rrSearch = search.load({
                    id: 'customsearch_kd_mr_rr_sublist'
                });
                rrSearch.filters.push(search.createFilter({
                    name: 'custbody_kd_master_return_id',
                    operator: search.Operator.ANYOF,
                    values: mrrId
                }));
                rrSearch.filters.push(search.createFilter({
                    name: 'custbody_kd_rr_category',
                    operator: search.Operator.ANYOF,
                    values: CATEGORY_C2
                }));
                var rs = rrSearch.run().getRange({ start: 0, end: 1 });
                
                if(rs.length > 0){
                    rrId = rs[0].id;
                }
                log.debug('TEST', 'RR ID ' + rrId);
            }

            for(var i = 0; i < lines.length; i++){
                line = lines[i];
                try{
                    itemId = '';
                    itemCategory = '';
                    rirRec = record.create({
                        type: REC_RETURN_ITEM_REQUESTED,
                        isDynamic: true
                    });  
                    
                    rirRec.setValue({
                        fieldId: RIR_FLD_MRR_ID,
                        value: mrrId
                    });

                    rirRec.setValue({
                        fieldId: RIR_FLD_LINE_ID,
                        value: line['LINE ID']
                    });

                    rirRec.setValue({
                        fieldId: RIR_FLD_QUANTITY,
                        value: line['QUANTITY']
                    });

                    if(line['FULL/PARTIAL PACKAGE'].toUpperCase() == 'FULL PACKAGE'){
                        rirRec.setValue({
                            fieldId: RIR_FLD_FULL_PARTIAL,
                            value: 1
                        });
                    }else{
                        rirRec.setValue({
                            fieldId: RIR_FLD_FULL_PARTIAL,
                            value: 2
                        });
                    }
                    
                    rirRec.setValue({
                        fieldId: RIR_FLD_LOT_NUMBER,
                        value: line['LOT NUMBER']
                    });

                    log.debug('TEST', 'DATE ' + line['LOT EXPIRATION']);
                    rirRec.setValue({
                        fieldId: RIR_FLD_LOT_EXPIRATION,
                        value: format.parse({value: line['LOT EXPIRATION'], type: format.Type.DATE})
                    });

                    /*itemId = getItemId(line['ITEM'], category);
                    if(itemId == ''){
                        switch(category){
                            case 'RXOTC':
                                itemId = UNIDENTIFIED_RX_OTC_ITEM_ID;
                                break;
                            case 'C35':
                                itemId = UNIDENTIFIED_C35_ITEM_ID;
                                break;
                            case 'C2':
                                itemId = UNIDENTIFIED_C2_ITEM_ID;
                                break;
                        }
                    }

                    rirRec.setValue({
                        fieldId: RIR_FLD_ITEM,
                        value: itemId
                    });*/
                
                    itemDetails = getItemDetails(line['ITEM']);
                    if(Object.keys(itemDetails).length > 0){
                        itemId = itemDetails.id;
                        itemCategory = itemDetails.category;

                        if(itemCategory != category){
                            throw('Item is not of same category');
                        }
                         
                    }else{
                        switch(category){
                            case CATEGORY_RX_OTC:
                                itemId = UNIDENTIFIED_RX_OTC_ITEM_ID;
                                break;
                            case CATEGORY_C3_5:
                                itemId = UNIDENTIFIED_C35_ITEM_ID;
                                break;
                            case CATEGORY_C2:
                                itemId = UNIDENTIFIED_C2_ITEM_ID;
                                break;
                        }
                    }

                    rirRec.setValue({
                        fieldId: RIR_FLD_ITEM,
                        value: itemId
                    });
                    if(category == CATEGORY_C2){
                        rirRec.setValue({
                            fieldId: 'custrecord_kd_rir_return_request',
                            value: rrId
                        });
                        log.debug('TEST', 'set RIR RR ID ' + rrId);
                    }

                    var rirId = rirRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    if(category == CATEGORY_C2){
                        c2RirIds.push(rirId);
                    }

                    log.debug('createItemsRequested', 'Created RIR ID ' + rirId);
                }catch(ex){
                    errorLines = ex + ','+ rawLines[i+1] + "\r\n";
                    log.error({ title: 'createItemsRequested: error', details: ex });
                }
            }

            if(errorLines != ''){
                var fileName = 'RESULTS_MRR' + mrrId;
                switch(category){
                    case CATEGORY_RX_OTC:
                        fileName = fileName + '_RX_OTC';
                        break;
                    case CATEGORY_C3_5:
                        fileName = fileName + '_C3_5';
                        break;
                    case CATEGORY_C2:
                        fileName = fileName + '_C2';
                        break;
                }
                errorLines = 'RESULT,ITEM,LINE ID,QUANTITY,FULL/PARTIAL PACKAGE,LOT NUMBER,LOT EXPIRATION' + "\r\n" + errorLines;
                var fileObj = file.create({
                    name: fileName + '.csv',
                    fileType: file.Type.CSV,
                    contents: errorLines,
                    encoding: file.Encoding.UTF8,
                    folder: folderId,
                    isOnline: true
                });

                resultsId = fileObj.save();
            }
            log.debug('TEST', 'c2RirIds: ' + JSON.stringify(c2RirIds));
            if(c2RirIds.length > 0){
                assignForm222No(c2RirIds, mrrId, rrId);
            }
        }

        return resultsId;
    }
    var REC_FORM222_REF = 'customrecord_kd_222formrefnum';
    var FLD_FORM222_RR = 'custrecord_kd_returnrequest';
    var FLD_FORM222_PAGE = 'custrecord_kd_form222_page';
    var FLD_RIR_FORM222_REF = 'custrecord_kd_rir_form222_ref';
    function assignForm222No(rirIds, mrrId, rrId){
        var form222Count = Math.ceil(rirIds.length / 20);
        var form222RefRecs = [];
        var form222RefRec;
        for(var i = 1; i <= form222Count; i++){
            form222RefRec = record.create({
                type: REC_FORM222_REF,
                isDynamic: true
            });
            form222RefRec.setValue({
                fieldId: FLD_FORM222_PAGE,
                value: i,
                ignoreFieldChange: true
            });
            form222RefRec.setValue({
                fieldId: FLD_FORM222_RR,
                value: rrId,
                ignoreFieldChange: true
            });
            form222RefRecs.push(form222RefRec.save());
        }

        var currentPageCount = 0;
        var currentPage = 1;
        var form222Indx = 0;
        for(var i = 0; i < rirIds.length; i++){   
            record.submitFields({
                type: REC_RETURN_ITEM_REQUESTED,
                id: rirIds[i],
                values: {
                    'custrecord_kd_rir_form_222_no': currentPage,
                    'custrecord_kd_rir_form222_ref': form222RefRecs[form222Indx]
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            log.debug('TEST', 'assigned ' + currentPage + ' to ' + rirIds[i]);
            currentPageCount++;
            if(currentPageCount == 20){
                currentPageCount = 0;
                currentPage++;
                form222Indx++;
            }
        }

        if(rrId != ''){
            record.submitFields({
                type: 'customsale_kod_returnrequest',
                id: rrId,
                values: {
                    'custbody_kd_no_form_222': form222Count
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
        }
    }
    function getInputData(){
        log.debug('getInputData', 'START');
        return search.load({
            id: SEA_MRR_FOR_IMPORT
        });
    }
    function map(context){
        log.debug('map', 'START');
        try{
            var data = JSON.parse(context.value);
            var mrrId = data.values.id;
            var mrrRec = record.load({
                type: REC_MRR,
                id: mrrId
            });
            log.debug('map', 'processing for MRR ' + mrrId);
            var rxOtcFileId, c35FileId, c2FileId;
            var rxOtcImported = false, c35Imported = false, c2Imported = false;
            var rxOtcResultsId, c35ResultsId, c2ResultsId;

            if(mrrRec.getValue(MRR_FLD_RXOTC) && !mrrRec.getValue(MRR_FLD_RX_OTC_IMPORTED)){
                log.debug('test', 'rx otc is true');
                rxOtcFileId = mrrRec.getValue(MRR_FLD_RXOTC_FILE);
                if(rxOtcFileId != ''){
                    var rxOtcFile = file.load({
                        id: rxOtcFileId
                    });
                    if(rxOtcFile.fileType == file.Type.CSV){
                        //createItemsRequested(rxOtcFile, 'RXOTC', mrrId);
                        rxOtcResultsId = createItemsRequested(rxOtcFile, CATEGORY_RX_OTC, mrrId, rxOtcFile.folder);
                        rxOtcImported = true;
                    }
                }
            }else{
                log.debug('test', 'rx otx is false');
            }
            
            if(mrrRec.getValue(MRR_FLD_C35) && !mrrRec.getValue(MRR_FLD_C3_5_IMPORTED)){
                log.debug('test', 'c35 is true');
                c35FileId = mrrRec.getValue(MRR_FLD_C35_FILE);
                if(c35FileId != ''){
                    var c35File = file.load({
                        id: c35FileId
                    });
                    if(c35File.fileType == file.Type.CSV){
                        //createItemsRequested(c35File, 'C35', mrrId);
                        c35ResultsId = createItemsRequested(c35File, CATEGORY_C3_5, mrrId, c35File.folder);
                        c35Imported = true;
                    }
                }
            }else{
                log.debug('test', 'c35 is false');
            }

            if(mrrRec.getValue(MRR_FLD_C2) && !mrrRec.getValue(MRR_FLD_C2_IMPORTED)){
                log.debug('test', 'c2 is true');
                c2FileId = mrrRec.getValue(MRR_FLD_C2_FILE);
                if(c2FileId != ''){
                    var c2File = file.load({
                        id: c2FileId
                    });
                    if(c2File.fileType == file.Type.CSV){
                        //createItemsRequested(c2File, 'C2', mrrId);
                        c2ResultsId = createItemsRequested(c2File, CATEGORY_C2, mrrId, c2File.folder);
                        c2Imported = true;
                    }
                }
            }else{
                log.debug('test', 'c2 is false');
            }

            if(mrrRec.getValue(MRR_FLD_RX_OTC_IMPORTED)){
                rxOtcImported = true;
                rxOtcResultsId = mrrRec.getValue(MRR_FLD_RXOTC_RESULTS);
            }
            if(mrrRec.getValue(MRR_FLD_C3_5_IMPORTED)){
                c35Imported = true;
                c35ResultsId = mrrRec.getValue(MRR_FLD_C35_RESULTS);
            }
            if(mrrRec.getValue(MRR_FLD_C2_IMPORTED)){
                c2Imported = true;
                c2ResultsId = mrrRec.getValue(MRR_FLD_C2_RESULTS);
            }

            record.submitFields({
                type: REC_MRR,
                id: mrrId,
                values: {
                    custrecord_kd_mrr_for_csv_import: false,
                    custrecord_rx_otc_imported: rxOtcImported,
                    custrecord_c2_imported: c2Imported,
                    custrecord_c3_5_imported: c35Imported,
                    custrecord_kd_mrr_rxotc_results: rxOtcResultsId,
                    custrecord_kd_mrr_c35_results: c35ResultsId,
                    custrecord_kd_mrr_c2_results: c2ResultsId
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });

        }catch(ex){
            log.error({ title: 'map: error', details: ex });
        }
        //var mrrId = runtime.getCurrentScript().getParameter({name:'custscript_mrr_id'});
    }
    function summarize(summary){
        log.debug('summarize', 'START');
        var mrrSearch = search.load({
            id: SEA_MRR_FOR_IMPORT
        });
        if(mrrSearch.run().getRange({ start: 0, end: 1 }).length){
            log.debug('TEST', 'there are still MRR to be processed, scheduling another deployment.');
            //schedule deployment 2
            try{
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_kd_mr_create_item_requested'/*,
                    deploymentId: 'customdeploy_kd_mr_create_it_requested',
                    params: {
                        custscript_mrr_id: mrrRec.id
                    }*/
                });
                //var mrTaskId = mrTask.submit();
                /*var mrTaskStatus = task.checkStatus({
                    taskId: mrTaskId
                });*/
                //log.debug('TEST', 'MR Task Status ' + mrTaskStatus);
                //if(mrTaskStatus == FAILED)
            }catch(ex){
                log.error({title: 'map/reduce task creation', details: ex });
            }
        }
    }
    return{
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});