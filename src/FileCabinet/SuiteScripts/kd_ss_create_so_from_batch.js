/**
* @NApiVersion 2.x
* @NScriptType ScheduledScript
*/
define(['N/runtime', 'N/search', 'N/record', 'N/task'],
function(runtime, search, record, task) {
    var SEA_BATCH_REC_FOR_SO = 'customsearch_kd_batch_rec_for_so';
    var SEA_RR_LINES = 'customsearch_kd_rr_lines';
    var REC_RETURN_REQUEST = 'customsale_kod_returnrequest';
    var REC_BATCH_RECORD = 'customrecord_kd_batch_record';
    var REC_TAG_RECORD = 'customrecord_kd_taglabel';
    var FLD_SO_RR = 'custbody_kd_return_request2';
    var FLD_BR_MANUF = 'custrecord_kd_br_manufacturer';
    var FLD_BR_TAG_NOS = 'custrecord_kd_br_tag_nos';
    var FLD_BR_MFG_SO = 'custrecord_kd_br_mfg_so';
    var FLD_BR_EXEC_DATE = 'custrecord_kd_br_execution_date';
    var FLD_RR_IT_TAG = 'custcol_kd_baglabel_link';
    var FLD_RR_IT_MANUFACTURER = 'custcol_kd_item_manufacturer';
    var FLD_RR_IT_WHOLESALER = 'custcol_kd_wholesaler';
    var manufWholesaler = {};
    
    function _setCurrentSublistValue(objRec, sublistId, fieldId, value, ignoreFieldChange) {
        return objRec.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            value: value,
            ignoreFieldChange: false
        });
    }
    function getRrIdsAndLines(tagLabels){
        log.debug('getRrIdsAndLines', 'START');
        var rrLinesSearch = search.load({
            id: SEA_RR_LINES
        });
        rrLinesSearch.filters.push(search.createFilter({
            name: FLD_RR_IT_TAG,
            operator: search.Operator.ANYOF,
            values: tagLabels
        }));

        var rrIds = [], rrLineKeys = {};
        rrLinesSearch.run().each(function(result) {
            lineUniqueKey = result.getValue({
                name: 'lineuniquekey'
            });
            rrId = result.getValue({
                name: 'internalid'
            });
            if(rrIds.indexOf(rrId) < 0){
                rrIds.push(rrId);
                rrLineKeys[rrId] = [];
            }
            rrLineKeys[rrId].push(lineUniqueKey);
            return true;
        });
        return {rrids: rrIds, rrlinekeys: rrLineKeys};
    }
    function getReturnRequests(rrIds, rrLineKeys) {
        log.debug('getItems', 'START');
        var rrId, rrRec, rrSubRec, lineKey, items = [];
        var item, quantity, priceLevel, rate, amount, manufacturer, wholesaler, location;
        var subRecNum, subRecQty, subRecExpDate;
        for(var i = 0; i < rrIds.length; i++){
            rrId = rrIds[i];
            rrRec = record.load({
                type: REC_RETURN_REQUEST,
                id: rrId/*,
                isDynamic: true*/
            });
            location = rrRec.getValue('location');
            for(var itemIndx = 0; itemIndx < rrRec.getLineCount('item'); itemIndx++) {
                invDetail = [];
                lineKey = rrRec.getSublistValue('item', 'lineuniquekey', itemIndx);
                if(rrLineKeys[rrId].indexOf(lineKey) >= 0){
                    item = rrRec.getSublistValue('item', 'item', itemIndx);
                    quantity = rrRec.getSublistValue('item', 'quantity', itemIndx);
                    priceLevel = rrRec.getSublistValue('item', 'priceLevel', itemIndx);
                    rate = rrRec.getSublistValue('item', 'rate', itemIndx);
                    amount = rrRec.getSublistValue('item', 'amount', itemIndx);
                    manufacturer = rrRec.getSublistValue('item', FLD_RR_IT_MANUFACTURER, itemIndx);
                    wholesaler = rrRec.getSublistValue('item', FLD_RR_IT_WHOLESALER, itemIndx);
                    if(!manufWholesaler.hasOwnProperty(manufacturer) && wholesaler != ''){
                        manufWholesaler[manufacturer] = wholesaler;
                    }

                    rrSubRec = rrRec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: itemIndx
                    });

                    for(var subrecIndx = 0; subrecIndx < rrSubRec.getLineCount('inventoryassignment'); subrecIndx++) {
                        subRecNum = rrSubRec.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'numberedrecordid',//'receiptinventorynumber',
                            line: subrecIndx
                        });
    
                        subRecQty = rrSubRec.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: subrecIndx
                        });
    
                        subRecExpDate = rrSubRec.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            line: subrecIndx
                        });
                        /*subRecExpDate = format.parse({
                            value: subRecExpDate,
                            type: format.Type.DATE
                        });*/
                        invDetail.push({invnum: subRecNum, quantity: subRecQty, expdate: subRecExpDate});
                    }

                    items.push({
                        item: item,
                        quantity: quantity,
                        pricelevel: priceLevel,
                        rate: rate,
                        amount: amount,
                        inventorydetail: invDetail
                    });
                }
            }
        }
        log.debug('map', 'items ' + JSON.stringify(items))
        log.debug('Remaining governance units: ' + runtime.getCurrentScript().getRemainingUsage());
        return {location: location, rrids: rrIds, items: items};
    }
    function createSalesOrder(rrDetails, manuf) {
        log.debug('createSalesOrder', 'START');
        var soId;
        try{
            if (rrDetails.items.length > 0) {
                var soRec = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: true
                });
                if(manufWholesaler.hasOwnProperty(manuf)){
                    soRec.setValue('entity', manufWholesaler[manuf]);
                }else{
                    soRec.setValue('entity', manuf);
                }
                soRec.setValue( 'orderstatus', 'B');
                soRec.setValue(FLD_SO_RR, rrDetails.rrids);
                soRec.setValue('location', rrDetails.location);
                var itemLines = rrDetails.items;
                var item, qty, priceLevel, rate, amount, invDtl, invDtlNum, invDtlQty, invDtlExpData, bag;
                for (var i = 0; i < itemLines.length; i++) {
                    item = itemLines[i].item;
                    qty = itemLines[i].quantity;
                    priceLevel = itemLines[i].pricelevel;
                    rate = itemLines[i].rate;
                    amount = itemLines[i].amount;
                    invDtl = itemLines[i].inventorydetail;
    
                    soRec.selectNewLine('item');
                    _setCurrentSublistValue(soRec, 'item', 'item', item, false);
                    _setCurrentSublistValue(soRec, 'item', 'quantity', qty, false);
                    _setCurrentSublistValue(soRec, 'item', 'price', priceLevel, false);
                    _setCurrentSublistValue(soRec, 'item', 'rate', rate, false);
                    _setCurrentSublistValue(soRec, 'item', 'amount', amount, false);
                    _setCurrentSublistValue(soRec, 'item', 'custcol_kd_baglabel_link', bag, false);
    
                    soRec.commitLine('item');
                }
                soId = soRec.save();
            }
            log.debug('createSalesOrder', 'soId created ' + soId);
            return soId;
        } catch(ex) {
            return -1;
        }
    }

    function updateSoInventoryDetail(soId, soItems) {
        try{
            var soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: true,
            });
    
            var isNumbered;
            var invDtl, invDtlNum, invDtlQty, invDtlExpDate;
            for (var i = 0; i < soRec.getLineCount('item'); i++) {
                soRec.selectLine({
                    sublistId: 'item',
                    line: i
                });
    
                var subRec = soRec.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });
    
                invDtl = soItems[i].inventorydetail;
                log.debug('updateSoInventoryDetail', JSON.stringify(invDtl));
                for (var j = 0; j < invDtl.length; j++) {
                    invDtlNum = invDtl[j].invnum;
                    invDtlQty = invDtl[j].quantity;
                    invDtlExpDate = invDtl[j].expdate;
                    log.debug('updateSoInventoryDetail', 'invDetail num: ' + invDtlNum + '; qty: ' + invDtlQty + '; expdate: ' + invDtlExpDate)
                    subRec.selectNewLine({
                        sublistId: 'inventoryassignment',
                    });
    
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: invDtlQty
                    });
    
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        value: invDtlNum
                    });
    
                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: invDtlExpDate
                    });
    
                    subRec.commitLine({
                        sublistId: 'inventoryassignment'
                    });
                }
    
                soRec.commitLine({
                    sublistId: 'item'
                });
            }
    
            var soId = soRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('updateSoInventoryDetail', 'SO ID: ' + soId)
            return true;
        }catch(ex){
            record.delete({
                type: record.Type.SALES_ORDER,
                id: soId
             });
            log.debug('ERR', ex.message);
            return false;
        }
    }
    function createBatchRecord(manuf, manufBatch){
        var rrIds, rrIdsUpdated = [], linesByRetReq, rrLines;
        var batchRec, rrRec, lineUniqueKey;
        for(var manufBatchIndx = 0; manufBatchIndx < manufBatch.length; manufBatchIndx++){
            batchRec = record.create({
                type: REC_BATCH_RECORD,
                isDynamic: true
            });
            batchRec.setValue({
                fieldId: FLD_BATCH_MANUF,
                value: manuf,
                ignoreFieldChange: true
            });
            batchRec.setValue({
                fieldId: FLD_BATCH_VALUE_OF_TAGS,
                value: manufBatch[manufBatchIndx].sumoftags,
                ignoreFieldChange: true
            });
            batchRec.setValue({
                fieldId: FLD_BATCH_TAGS,
                value: manufBatch[manufBatchIndx].tags,
                ignoreFieldChange: true
            });
            batchId = batchRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('test', 'create record');
            log.debug('test', 'manuf ' + manuf);
            log.debug('test', 'sumoftags ' + manufBatch[manufBatchIndx].sumoftags);
            log.debug('test', 'tags ' + JSON.stringify(manufBatch[manufBatchIndx].tags));
            log.debug('test', 'linesbyrr ' + JSON.stringify(manufBatch[manufBatchIndx].linesbyrr));
            log.debug('test', 'save record');

            linesByRetReq = manufBatch[manufBatchIndx].linesbyrr;
            for(var rrId in linesByRetReq){
                rrLines = linesByRetReq[rrId];
                log.debug('test', 'LOAD rr ' + rrId);
                rrRec = record.load({
                type: REC_RET_REQ,
                id: rrId,
                isDynamic: true
                });
                for(var rrRecLineIndx = 0; rrRecLineIndx < rrRec.getLineCount('item'); rrRecLineIndx++){
                rrRec.selectLine({
                    sublistId: 'item',
                    line: rrRecLineIndx
                });
                lineUniqueKey = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'lineuniquekey'
                });
                log.debug('test', lineUniqueKey + ' IN ' + rrLines);
                if(rrLines.indexOf(lineUniqueKey) >= 0){
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_batch_record_created',
                        value: true,
                        ignoreFieldChange: true
                    });
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_batch_id',
                        value: batchId,
                        ignoreFieldChange: true
                    });
                }
                rrRec.commitLine({
                    sublistId: 'item'
                });
                }
                rrRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });           
                log.debug('test', 'SAVE rr ' + rrId);
            }
        }
    }
    function updateTags(tagLabels, soId){
        try{
            for(var tagIndx = 0; tagIndx < tagLabels.length; tagIndx++){
                var id = record.submitFields({
                    type: REC_TAG_RECORD,
                    id: tagLabels[tagIndx],
                    values: {
                        custrecord_kd_mfgso_link: soId
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }
            return true;
        }catch(ex){
            return false;
        }
        
    }
    function createSalesOrders(searchId){
        log.debug('test', 'createSalesOrders START TEST')
        var batchSearch = search.load({
            id: SEA_BATCH_REC_FOR_SO
        });
        var start = 0;
        var end = 1000;
        var searchRs = batchSearch.run();
        var results = searchRs.getRange(start, end);
        log.debug('test', 'results length ' + results.length);
        var batchId, manuf, tagLabels, rrDetails, rrIdsAndKeys, batchRec;
        var usageNeeded;
        var manuf;
        do{
            for(var i = 0; i < results.length; i++){
                batchId = results[i].getValue('internalid');
                log.debug('test', 'batchId:  '+ batchId);
                manuf = results[i].getValue(FLD_BR_MANUF);
                tagLabels = results[i].getValue(FLD_BR_TAG_NOS).split(',');
                log.debug('test', 'tagLabels:  '+ JSON.stringify(tagLabels));
                rrIdsAndKeys = getRrIdsAndLines(tagLabels);
                usageNeeded = (rrIdsAndKeys.rrids.length * 10) + (tagLabels.length * 2) + 100;
                log.debug('Check Remaining Usage', runtime.getCurrentScript().getRemainingUsage() + ' > ' + usageNeeded);
                if(runtime.getCurrentScript().getRemainingUsage() > usageNeeded){//9950
                    rrDetails = getReturnRequests(rrIdsAndKeys.rrids, rrIdsAndKeys.rrlinekeys);
                    log.debug('test', 'rrDetails:  '+ JSON.stringify(rrDetails));
                    log.debug('test', 'manufWholesaler ' + JSON.stringify(manufWholesaler));
                    var soId = createSalesOrder(rrDetails, manuf);
                    if(parseInt(soId) > 0 && updateSoInventoryDetail(soId, rrDetails.items)){
                        try{
                            log.debug('map', 'updating batch ' + batchId);
                            batchRec = record.load({
                                type: REC_BATCH_RECORD,
                                id: batchId,
                                isDynamic: true
                            });
                            batchRec.setValue(FLD_BR_MFG_SO, soId);
                            batchRec.setValue(FLD_BR_EXEC_DATE, new Date());
                            batchRec.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('test', 'batch updated');
                            if(!updateTags(tagLabels, soId)){
                                record.delete({
                                    type: record.Type.SALES_ORDER,
                                    id: soId
                                });
                                record.submitFields({
                                    type: REC_BATCH_RECORD,
                                    id: batchId,
                                    values: {
                                        FLD_BR_EXEC_DATE: ''
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields : true
                                    }
                                });
                            }
                        }catch(ex){
                            record.delete({
                                type: record.Type.SALES_ORDER,
                                id: soId
                            });
                            record.submitFields({
                                type: REC_BATCH_RECORD,
                                id: batchId,
                                values: {
                                    FLD_BR_EXEC_DATE: ''
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                            log.debug('ERR', ex.message);
                        }
                        //updateTags(tagLabels, soId);
                    }
                    log.debug('TEST','getInputData getInputDataRemaining governance units: ' + runtime.getCurrentScript().getRemainingUsage());
                }else{
                    log.debug('RESCHEDULING','RESCHEDULING');
                    var scheduledScriptTask = task.create({ // rescheduling the script
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: runtime.getCurrentScript().id,
                        deploymentId: runtime.getCurrentScript().deploymentId
                    });
                    scheduledScriptTask.submit();
                }
            }
            start += 1000;
            end += 1000;
            results = searchRs.getRange(start, end);
        }while(results.length > 0);
    }
    function execute(scriptContext) {
        try {
            createSalesOrders();
            return true;
        } catch (e) {
            log.debug('ERR', e.message);
        }
    }
    return {
        execute: execute
    }
});