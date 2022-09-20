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


        const beforeSubmit = (context) => {
            var PHARMACALC = 8
            var PHARMACALC1 = 9
            var PHARMACALC2 = 10
            var NONRETURNABLE = 7
            var PRICELEVEL;
            var PHARMAPRICINGORDER
            var pharmaPrice1Rec = record.load({
                type: 'customrecord_kodella_prclvlpriorder',
                id: 1
            })
            var pharmaPrice2Rec = record.load({
                type: 'customrecord_kodella_prclvlpriorder',
                id: 2
            })

            var pharmaPrice3Rec = record.load({
                type: 'customrecord_kodella_prclvlpriorder',
                id: 3
            })
            // PHARMA PRICING 1 LEVELS
            var pharmaPrice1PriceLevel1 = pharmaPrice1Rec.getValue('custrecord_kodella_prclvl1')
            var pharmaPrice1PriceLevel2 = pharmaPrice1Rec.getValue('custrecord_kodella_prclvl2')
            var pharmaPrice1PriceLevel3 = pharmaPrice1Rec.getValue('custrecord_kodella_prclvl3')
            log.debug('pharmaPrice1PriceLevel1: ' + pharmaPrice1PriceLevel1 + ' pharmaPrice1PriceLevel2: ' + pharmaPrice1PriceLevel2 +  ' pharmaPrice1PriceLevel3: ' + pharmaPrice1PriceLevel3)
            // PHARMA PRICING 2 LEVELS
            var pharmaPrice2PriceLevel1 = pharmaPrice2Rec.getValue('custrecord_kodella_prclvl1')
            var pharmaPrice2PriceLevel2 = pharmaPrice2Rec.getValue('custrecord_kodella_prclvl2')
            var pharmaPrice2PriceLevel3 = pharmaPrice2Rec.getValue('custrecord_kodella_prclvl3')
            log.debug('pharmaPrice2PriceLevel1: ' + pharmaPrice2PriceLevel1 + ' pharmaPrice2PriceLevel2: ' + pharmaPrice2PriceLevel2 +  ' pharmaPrice2PriceLevel3: ' + pharmaPrice2PriceLevel3)
            // PHARMA PRICING 3 LEVELS
            var pharmaPrice3PriceLevel1 = pharmaPrice3Rec.getValue('custrecord_kodella_prclvl1')
            var pharmaPrice3PriceLevel2 = pharmaPrice3Rec.getValue('custrecord_kodella_prclvl2')
            var pharmaPrice3PriceLevel3 = pharmaPrice3Rec.getValue('custrecord_kodella_prclvl3')
            log.debug('pharmaPrice3PriceLevel1: ' + pharmaPrice3PriceLevel1 + ' pharmaPrice3PriceLevel2: ' + pharmaPrice3PriceLevel2 +  ' pharmaPrice3PriceLevel3: ' + pharmaPrice3PriceLevel3)
            var rec = context.newRecord;
            log.debug('Rec' + rec)

            var lineCount = rec.getLineCount({sublistId:'item'})
            log.debug('LineCount', lineCount)
            for (var i = 0; i <lineCount; i++) {
                log.debug('Entering item loop' + i)

                var pharmaCalc
                var phamarCalc1
                var pharmaCalc2
                var itemId = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                log.debug('Item Id' + itemId)
                if (itemId == 649) {
                    rec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: i,
                        value: NONRETURNABLE
                    })
                } else {
                    var filters = new Array();
                    filters[0] = search.createFilter({
                        name: 'internalID',
                        operator: search.Operator.IS,
                        values: itemId
                    });
                    var columns = new Array();
                    columns[0] = search.createColumn({
                        name: 'custitem_kodella_pricingorder'
                    });
                    columns[1] = search.createColumn({
                        name: 'price8'
                    });
                    columns[2] = search.createColumn({
                        name: 'price9'
                    });
                    columns[3] = search.createColumn({
                        name: 'price10'
                    });
                    var mySearch = search.create({
                        type: search.Type.ITEM,
                        filters: filters,
                        columns: columns
                    })
                    var result = mySearch.run();
                    //Price levels start with 'baseprice', then 'price' + 2 and up.


                    result.each(function (row) {

                        PHARMAPRICINGORDER = row.getValue({
                            name: 'custitem_kodella_pricingorder'
                        })
                        pharmaCalc = row.getValue({
                            name: 'price8'
                        })
                        phamarCalc1 = row.getValue({
                            name: 'price9'
                        })
                        pharmaCalc2 = row.getValue({
                            name: 'price10'
                        })


                        return true
                    })

                    log.debug('PharmaProcessing Order ' + PHARMAPRICINGORDER)
                    log.debug('Pharma CR value ' + pharmaCalc)
                    log.debug('calc1 value ' + phamarCalc1)
                    log.debug('calc2 value ' + pharmaCalc2)

                    if (PHARMAPRICINGORDER) {


                        switch (parseInt(PHARMAPRICINGORDER)) {
                            case 1:
                                log.debug('Pharma Order 1')
                                if (pharmaPrice1PriceLevel1 == PHARMACALC && pharmaCalc > 0) {
                                    log.debug('Entering Pharma Calc')
                                    var pricelev =   rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i
                                    });
                                    log.debug('Line ' + i + ' Price level ' + pricelev)
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: 8
                                    })

                                }


                                // else{
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: 8
                                //     })
                                // }
                                if(pharmaPrice1PriceLevel2 === PHARMACALC1 && phamarCalc1 > 0){
                                    log.debug('Entering Pharma Calc 1')
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice1PriceLevel2
                                    })
                                }

                                if(pharmaPrice1PriceLevel3 === PHARMACALC2 && pharmaCalc2 > 0){
                                    log.debug('Entering Pharma Calc 2')
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice1PriceLevel3
                                    })
                                }else{
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice1PriceLevel2
                                    })
                                }




                                // if (pharmaPrice1PriceLevel1 === PHARMACALC1 && phamarCalc1 > 0) {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: PHARMACALC1
                                //     })
                                // } else {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaPrice2PriceLevel2
                                //     })
                                // }
                                //
                                // if (pharmaPrice1PriceLevel3 === PHARMACALC2 && pharmaCalc2 > 0) {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: PHARMACALC2
                                //     })
                                // } else {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaPrice2PriceLevel2
                                //     })
                                // }


                                break;
                            case 2:
                                // PHARMA PROCESSING 2
                                log.debug('Pharma Order 2')
                                // if (pharmaPrice2PriceLevel1 === PHARMACALC && pharmaCalc > 0) {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaCalc
                                //     })
                                // } else {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaPrice3PriceLevel1
                                //     })
                                // }
                                // if (pharmaPrice2PriceLevel1 === PHARMACALC1 && phamarCalc1 > 0) {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: PHARMACALC1
                                //     })
                                // } else {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaPrice3PriceLevel1
                                //     })
                                // }
                                //
                                //
                                // if (pharmaPrice2PriceLevel1 === PHARMACALC2 && pharmaCalc2 > 0) {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: PHARMACALC2
                                //     })
                                // } else {
                                //     rec.setSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'price',
                                //         line: i,
                                //         value: pharmaPrice3PriceLevel1
                                //     })
                                // }

                                if (pharmaPrice2PriceLevel1 === PHARMACALC && pharmaCalc > 0) {
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaCalc
                                    })
                                } else{
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel3
                                    })
                                }
                                if(pharmaPrice2PriceLevel2 === PHARMACALC1 && phamarCalc1 > 0){
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel2
                                    })
                                }else{
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel3
                                    })
                                }

                                if(pharmaPrice2PriceLevel3 === PHARMACALC2 && pharmaCalc2 > 0){
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel3
                                    })
                                }else{
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel3
                                    })
                                }

                                break;
                            case 3:

                                // PHARMA PROCESSING 3
                                log.debug('Pharma Order 3')
                                if (pharmaPrice3PriceLevel1 === PHARMACALC) {
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice3PriceLevel1
                                    })
                                }

                                if (pharmaPrice3PriceLevel2 === PHARMACALC1) {
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice3PriceLevel1
                                    })
                                }

                                if (pharmaPrice2PriceLevel3 === PHARMACALC2) {
                                    rec.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'price',
                                        line: i,
                                        value: pharmaPrice2PriceLevel3
                                    })
                                }

                                break;
                            default:
                            // code block
                        }
                    }
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */


        return { beforeSubmit}

    });
