/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        var RETURNITEMSEARCH = 'customsearch_return_item_processed_searc';
        var RETURN_ITEM_PROCESSED = 'customrecord_kod_mr_item_process'

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        function _getSublistValue(objRec, sublistId, fieldId, line) {
            return objRec.getSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                line: line
            });
        }

        function _setCurrentSublistValue(objRec, sublistId, fieldId, value, ignoreFieldChange) {
            return objRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                value: value,
                ignoreFieldChange: false
            });
        }

        function updateItemProcessed(RIPId, curRec, line) {

            var linefinal = line - 1;
            var item, qty, amount, lotNumber, lotExpiration, creditMemo, invoice, rate, returnable, fullpartial, weight


            item = _getSublistValue(curRec, 'item', 'item', linefinal);
            qty = _getSublistValue(curRec, 'item', 'quantity', linefinal);
            rate = _getSublistValue(curRec, 'item', 'rate', linefinal);
            amount = _getSublistValue(curRec, 'item', 'amount', linefinal);
            returnable = _getSublistValue(curRec, 'item', 'custcol_kod_nonreturnable', linefinal);
            fullpartial = _getSublistValue(curRec, 'item', 'custcol_kod_fullpartial', linefinal);
            weight = _getSublistValue(curRec, 'item', 'custcol_kd_weight', linefinal)

            log.debug('CurrentRec', 'item: ' + item + '; qty: ' + qty + ';rate: ' + rate + '; amount:' + amount + '; returnable:' + returnable + '; weight:' + weight);

            var isNumbered;
            var curSubRec = curRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: linefinal
            });
            log.debug('curSubRec', curSubRec)
            isNumbered = _getSublistValue(curRec, 'item', 'isnumbered', linefinal);
            var type = curRec.type;
            log.debug('Type', type)
            if (type == 'creditmemo') {
                creditMemo = curRec.id;
            } else {
                invoice = curRec.id
            }

            log.debug('cuRRec', 'line ' + line + ' isnumbered ' + isNumbered);
            if (isNumbered) {
                if (type != 'creditmemo') {
                    lotNumber = curSubRec.getSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        line: 0
                    });
                } else {
                    lotNumber = _getSublistValue(curSubRec, 'inventoryassignment', 'receiptinventorynumber', 0)
                }

                lotExpiration = _getSublistValue(curSubRec, 'inventoryassignment', 'expirationdate', 0);
                log.debug('lotNumber: ' + lotNumber + '; lotExpiration: ' + lotExpiration)
            }

            if (RIPId) {
                var itemProcessedRec = record.load({
                    type: RETURN_ITEM_PROCESSED,
                    id: RIPId,
                    isDynamic: true
                });
                log.debug('Return Processed Record ', itemProcessedRec)
                if (type == 'creditmemo') {


                    item ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kod_item_processed',
                        value: item
                    }) : false
                    qty ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_return_item_proc_quantity',
                        value: qty
                    }) : false
                    fullpartial ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_ret_item_proc_pack_list',
                        value: fullpartial
                    }) : false
                    lotNumber ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_lotnumber',
                        value: lotNumber
                    }) : false
                    lotExpiration ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_lot_expiration',
                        value: lotExpiration
                    }) : false
                    amount ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_amount_charge',
                        value: amount
                    }) : false
                    rate ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_rate',
                        value: rate
                    }) : false

                    weight ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_weight',
                        value: weight
                    }) : false
                    creditMemo ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_credit_memo',
                        value: creditMemo
                    }) : false
                    returnable ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_pharma_proc',
                        value: returnable
                    }) : false

                }

                var itemProcId = itemProcessedRec.save({ignoreMandatoryFields: true})
                log.debug('Updated Proccess Id :' + itemProcId)
            }
        }

        const afterSubmit = (context) => {
            var curRec = context.newRecord;
            var oldRec = context.oldRecord;
            if (curRec != oldRec) {
                log.debug('Changes has happened')
            }
            var lineItem = 1;
            var mrId = curRec.getValue('custbody_kd_cm_master_return_id')
            log.debug('Mrr Id ' + mrId)
            if (mrId) {
                var lineCount = curRec.getLineCount('item')
                log.debug('LineCount :' + lineCount)
                for (var i = 1; i <= lineCount; i++) {

                    var itemProcessedSearch = search.load({
                        id: RETURNITEMSEARCH
                    });
                    itemProcessedSearch.filters.push(search.createFilter({
                        name: "custrecord_master_return_id",
                        operator: 'anyof',
                        values: mrId
                    }))
                    itemProcessedSearch.filters.push(search.createFilter({
                        name: "custrecord_kd_line_id",
                        operator: 'equalto',
                        values: i
                    }))
                    log.debug('itemProcessedSearch', JSON.stringify(itemProcessedSearch))
                    var searchResultCount = itemProcessedSearch.runPaged().count;
                    log.debug('Search Result Count :', searchResultCount)
                    if (searchResultCount > 0) {
                        itemProcessedSearch.run().each(function (result) {

                            var RIPiD = result.id;
                            var lineId = result.getValue({name: 'custrecord_kd_line_id'})
                            log.debug('RIPid: ' + RIPiD + 'line Id: ' + lineId)
                            if (lineId == i) {
                                updateItemProcessed(RIPiD, curRec, i)
                            }
                        })
                    }
                }
            }
        }

        return {afterSubmit}

    });
