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
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (context) => {
            context.form.clientScriptFileId = 8998
            var invoiceRec = context.newRecord;
            if (context.type == 'create')
                return;
            if (context.type == 'view') {
                var applyFeeQtyBased = context.form.addButton({
                    id: 'custpage_apply_fee_qty',
                    label: 'Non-returnable Fee based on Quantity',
                    functionName: 'applyFeeQty'
                });

                var applyFeeWeightBased = context.form.addButton({
                    id: 'custpage_apply_fee_weight',
                    label: 'Non-returnable Fee based on Weight',
                    functionName: 'applyFeeWeight'
                });
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (context) => {
            var TOTAL_NON_SCANNABLE_FEE_QTY;
            var TOTAL_222_FORM_FEE;
            var TOTAL_NON_RETURNABLE_FEE_QTY;
            var TOTAL_NON_RETURNABLE_FEE_WEIGHT;
            var TOTAL_RETURNABLE_FEE_QTY;
            var rec = context.newRecord
            var invRec = record.load({
                type: 'invoice',
                id: rec.id,
                isDynamic: true
            })

            for (var i = 0; i < invRec.getLineCount('item'); i++) {
                var itemId = invRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })
                if (itemId == 649) {
                    TOTAL_NON_SCANNABLE_FEE_QTY = invRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_non_scannable_fee_weight',
                        line: i
                    })
                    invRec.setValue({
                        fieldId: 'custbody_kd_total_non_scannable_w',
                        value: TOTAL_NON_SCANNABLE_FEE_QTY
                    })
                }

                if (itemId == 107) {
                    TOTAL_RETURNABLE_FEE_QTY = invRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_returnable_fee',
                        line: i
                    })
                    invRec.setValue({
                        fieldId: 'custbody_kd_total_returnable_fee_qty',
                        value: TOTAL_RETURNABLE_FEE_QTY
                    })
                }
                if (itemId == 208) {
                    TOTAL_222_FORM_FEE = invRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_222_form_fee',
                        line: i
                    })
                    invRec.setValue({
                        fieldId: 'custbody_kd_total_222_form_fee',
                        value: TOTAL_222_FORM_FEE
                    })
                }
                if (itemId == 207) {
                    TOTAL_NON_RETURNABLE_FEE_WEIGHT = invRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_non_returnable_fee_weight',
                        line: i
                    })
                    invRec.setValue({
                        fieldId: 'custbody_kd_total_non_returnable_fee_w',
                        value: TOTAL_NON_RETURNABLE_FEE_WEIGHT
                    })
                }
                if (itemId == 207) {
                    TOTAL_NON_RETURNABLE_FEE_QTY = invRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_non_returnable_fee_qty',
                        line: i
                    })
                    invRec.setValue({
                        fieldId: 'custbody_kd_total_non_returnable_qty',
                        value: TOTAL_NON_RETURNABLE_FEE_QTY
                    })
                }

            }
            var invId = invRec.save({ignoreMandatoryFields: true})
            log.debug('Invoice Id ', invId)
            var MRRID = rec.getValue('custbody_kd_cm_master_return_id')
            try {
                if (MRRID) {
                    var mrr222TotalFormFee = 0;
                    var mrrNonReturnableQtyTotal = 0;
                    var mrrNonReturnableWeightTotal = 0;
                    var mrrReturnableQtyTotal = 0;
                    var mrrNonScannableWeightTotal = 0;
                    var rrAggreFeeSearchOnj = search.load({
                        id: 'customsearch_kd_rr_aggree_fee_2'
                    })


                    rrAggreFeeSearchOnj.filters.push(search.createFilter({
                        name: 'custbody_kd_cm_master_return_id',
                        operator: 'anyof',
                        values: MRRID
                    }));
                    rrAggreFeeSearchOnj.run().each(function (result) {

                        mrr222TotalFormFee = result.getValue({
                            name: 'custbody_kd_total_222_form_fee',
                            summary: 'SUM'
                        })
                        mrrNonReturnableQtyTotal = result.getValue({
                            name: 'custbody_kd_total_non_returnable_qty',
                            summary: 'SUM'
                        })
                        mrrNonReturnableWeightTotal = result.getValue({
                            name: 'custbody_kd_total_non_returnable_fee_w',
                            summary: 'SUM'
                        })

                        mrrReturnableQtyTotal = result.getValue({
                            name: 'custbody_kd_total_returnable_fee_qty',
                            summary: 'SUM'
                        })

                        mrrNonScannableWeightTotal = result.getValue({
                            name: 'custbody_kd_total_non_scannable_w',
                            summary: 'SUM'
                        })


                        return true;
                    });

                    // mrr222TotalFormFee = objRecord.getValue('custrecord_kd_total_222_form_fee')
                    // mrrNonReturnableQtyTotal = objRecord.getValue('custrecord_kd_total_non_returnable_qty')
                    // mrrNonReturnableWeightTotal = objRecord.getValue('custrecord_kd_total_non_returnable_fee_w')
                    // mrrReturnableQtyTotal = objRecord.getValue('custrecord_kd_total_returnable_fee_qty')
                    // mrrNonScannableWeightTotal = objRecord.getValue('custrecord_kd_total_non_scannable_w')
                    log.debug('mrr222TotalFormFee ', mrr222TotalFormFee)
                    log.debug('mrrNonReturnableQtyTotal ', mrrNonReturnableQtyTotal)
                    log.debug('mrrNonReturnableWeightTotal ', mrrNonReturnableWeightTotal)
                    log.debug('mrrReturnableQtyTotal ', mrrReturnableQtyTotal)
                    log.debug('mrrNonScannableWeightTotal ', mrrNonScannableWeightTotal)
                    var objRecord = record.load({
                        type: 'customrecord_kod_masterreturn',
                        id: MRRID,
                        isDynamic: true,
                    });

                    objRecord.setValue({
                        fieldId: 'custrecord_kd_total_222_form_fee',
                        value: mrr222TotalFormFee
                    })
                    objRecord.setValue({
                        fieldId: 'custrecord_kd_total_non_returnable_qty',
                        value: mrrNonReturnableQtyTotal
                    })
                    objRecord.setValue({
                        fieldId: 'custrecord_kd_total_non_returnable_fee_w',
                        value: mrrNonReturnableWeightTotal
                    })
                    objRecord.setValue({
                        fieldId: 'custrecord_kd_total_returnable_fee_qty',
                        value: mrrReturnableQtyTotal
                    })
                    objRecord.setValue({
                        fieldId: 'custrecord_kd_total_non_scannable_w',
                        value: mrrNonScannableWeightTotal
                    })

                    var mrrId = objRecord.save({ignoreMandatoryFields: true})
                    log.debug('MRR ID ', mrrId)


                }
            } catch (e) {
                log.error(e.message)
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
