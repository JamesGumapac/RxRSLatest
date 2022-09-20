/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/runtime', 'N/search', 'N/record', 'N/task', 'N/file', 'N/format'],
function(runtime, search, record, task, file, format) {
    var SEA_BATCH_REC_FOR_SO = 'customsearch_kd_batch_rec_for_so';
    var SEA_RR_LINES = 'customsearch_kd_rr_lines';
    var REC_RETURN_REQUEST = 'customsale_kod_returnrequest';
    var FLD_SO_RR = 'custbody_kd_return_request2';
    var FLD_RR_IT_TAG = 'custcol_kd_baglabel_link';
    var FLD_RR_IT_MANUFACTURER = 'custcol_kd_item_manufacturer';
    var FLD_RR_IT_WHOLESALER = 'custcol_kd_wholesaler';
    var manufWholesaler = {};

    function getSublistValue(objRec, sublistId, fieldId, lineNo){
        var value  = rrRec.getSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            line: lineNo
        });

        return value;
    }
    function _setCurrentSublistValue(objRec, sublistId, fieldId, value, ignoreFieldChange) {
        return objRec.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: fieldId,
            value: value,
            ignoreFieldChange: false
        });
    }
    function getReturnRequests(tagLabels) {
        log.debug('getItems', 'START');
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
                    if(!manufWholesaler.hasOwnProperty(manufacturer)){
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
    }

    function updateSoInventoryDetail(soId, soItems) {
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
    }

    function getInputData() {
        log.debug('getInputData', 'START');
        var rrSearch = search.load({
            id: SEA_BATCH_REC_FOR_SO
        });
        log.debug('TEST','getInputData getInputDataRemaining governance units: ' + runtime.getCurrentScript().getRemainingUsage());
        return rrSearch;
    }

    function map(context) {
        log.debug('map', 'START');
        try {
            var data = JSON.parse(context.value);
            log.debug('map', JSON.stringify(data));
            var batchId = data.id;
            log.debug('map', batchId);
            var tagLabels = data.values.custrecord_kd_br_tag_nos;
            var manuf = data.values.custrecord_kd_br_manufacturer.value;
            log.debug('map', 'batch manuf ' + manuf);
            if (tagLabels.length == undefined) {
                tagLabels = [tagLabels.value]
            }
            log.debug('map', tagLabels);
            var rrDetails = getReturnRequests(tagLabels);
            log.debug('map', 'rrDetails ' + JSON.stringify(rrDetails));
            log.debug('map', 'manufWholesaler ' + JSON.stringify(manufWholesaler));
            var soId = createSalesOrder(rrDetails, manuf);
            updateSoInventoryDetail(soId, rrDetails.items);
            //createTagLabel(rrId);
        } catch (ex) {
            log.error({
                title: 'map: error',
                details: ex
            });
        }
        log.debug('TEST','map getInputDataRemaining governance units: ' + runtime.getCurrentScript().getRemainingUsage());
        //var mrrId = runtime.getCurrentScript().getParameter({name:'custscript_mrr_id'});
    }

    function reduce(context) {
        log.debug('reduce', 'START');
        try {
            log.debug('reduce', JSON.stringify(context))
            log.debug('reduce', JSON.stringify(context.key))
            log.debug('reduce', JSON.stringify(context.values))
            var contextValues = JSON.parse(context.values);
            var rrIds = contextValues.rrids;
            var rrLineKeys = contextValues.rrlinekeys;
            log.debug('reduce', 'rrIds: ' + JSON.stringify(rrIds))
            log.debug('reduce', 'rrLineKeys: ' + JSON.stringify(rrLineKeys))
            
        } catch (ex) {
            log.error({
                title: 'map: error',
                details: ex
            });
        }
        log.debug('TEST','map getInputDataRemaining governance units: ' + runtime.getCurrentScript().getRemainingUsage());
        //var mrrId = runtime.getCurrentScript().getParameter({name:'custscript_mrr_id'});
    }

    function summarize(summary) {
        log.debug('summarize', 'START');
        /*var rrSearch = search.load({
            id: SEA_RR
        });
        rrSearch.filters.push(search.createFilter({
            name: FLD_RR_FOR_TAG_LABEL_GEN,
            operator: search.Operator.IS,
            values: true
        }));
        rrSearch.filters.push(search.createFilter({
            name: 'status',
            operator: search.Operator.IS,
            values: 'CuTrSale102:K'
        }));
        if(rrSearch.run().getRange({ start: 0, end: 1 }).length > 0){
            log.debug('TEST', 'there are still RR to be processed, scheduling another deployment.');
            try{
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_kd_mr_create_tag_labels'
                });
                var mrTaskId = mrTask.submit();
                var mrTaskStatus = task.checkStatus({
                    taskId: mrTaskId
                });
                log.debug('TEST', 'MR Task Status ' + mrTaskStatus);
            }catch(ex){
                log.error({title: 'map/reduce task creation', details: ex });
            }
        }*/
    }
    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});