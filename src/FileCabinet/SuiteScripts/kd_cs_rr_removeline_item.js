/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/message'],
    /**
     * @param{currentRecord} currentRecord
     * @param{message} message
     */
    function (currentRecord, message, record, search) {
        var FLD_RET_REQ_IT_PROCESSING = 'custcol_kod_rqstprocesing';
        var PROCESSING_DESTRUCTION = 1;
        var PROCESSING_RETURN_FOR_CREDIT = 2;
        var totalItemWeight = 0;
        const PENDINGVERIFICATION = 'K'

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function showMessageItemProcessed() {
            location.reload()
            var infoMessage = message.create({
                title: 'INFORMATION',
                message: 'Creating Item Processed Record',
                type: message.Type.INFORMATION,

            });
            infoMessage.show()

        }

        function _getSublistValue(objRec, sublistId, fieldId, line) {
            return objRec.getSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                line: line
            });
        }

        function pageInit(context) {
            try {


                var rec = context.currentRecord;
                if (rec.getValue('transtatus') == 'F') {
                    log.debug('Rec', rec)
                    var item = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: 0
                    });
                    log.debug('item', item)
                    for (var i = 0; i < rec.getLineCount('item'); i++) {
                        // rec.selectLine({sublistId: 'item', line: i})
                        var item = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        log.debug('item', item)
                        if (item == 626 || item == 627 || item == 628) {
                            rec.removeLine({
                                sublistId: 'item',
                                line: i
                            })

                            //    rec.commitLine('item')
                        }

                    }

                }
                if (context.mode == 'view' && rec.getValue('transtatus') == 'I') {
                    console.log('Showing Infor message')
                    showMessageItemProcessed()
                }
            } catch (e) {
                log.error(e.message)
            }

        }

        function postSourcing(context) {
            var PHARMACALC = 8
            var PHARMACALC1 = 9
            var PHARMACALC2 = 10
            var NONRETURNABLE = 7
            var PHARMAPRICINGORDER;
            var curRec = context.currentRecord;
            console.log('Cur Rec' + curRec)
            var sublistName = context.sublistId;
            var fieldName = context.fieldId;
            if (sublistName === 'item' && fieldName === "item") {

                var itemId = curRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });
                // if(_getSublistValue(curRec,'item',FLD_RET_REQ_IT_PROCESSING,i) == PROCESSING_DESTRUCTION){
                //
                // }
                log.debug('Item Id' + itemId)
                if (itemId) {

                    if (itemId == 649) {
                        curRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
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


                        var pharmaPricePriceLevel1
                        var pharmaPricePriceLevel2
                        var pharmaPricePriceLevel3
                        var pharmaPriceRec;
                        if (PHARMAPRICINGORDER) {
                            pharmaPriceRec = record.load({
                                type: 'customrecord_kodella_prclvlpriorder',
                                id: parseInt(PHARMAPRICINGORDER)
                            })
                            log.debug('pharmaPriceRec', pharmaPriceRec)

                        }
                        try {
                            pharmaPricePriceLevel1 = pharmaPriceRec.getValue({
                                fieldId: 'custrecord_kodella_prclvl1'
                            })
                            pharmaPricePriceLevel2 = pharmaPriceRec.getValue({
                                fieldId: 'custrecord_kodella_prclvl2'
                            })
                            pharmaPricePriceLevel3 = pharmaPriceRec.getValue({
                                fieldId: 'custrecord_kodella_prclvl3'
                            })

                        } catch (e) {
                            log.error(e.message)
                        }
                        log.debug('pharmaPrice1PriceLevel1: ' + pharmaPricePriceLevel1 + ' pharmaPrice1PriceLevel2: ' + pharmaPricePriceLevel2 + ' pharmaPrice1PriceLevel3: ' + pharmaPricePriceLevel3)

                        log.debug('PharmaProcessing Order ' + PHARMAPRICINGORDER)
                        log.debug('Pharma CR value ' + pharmaCalc)
                        log.debug('calc1 value ' + phamarCalc1)
                        log.debug('calc2 value ' + pharmaCalc2)


                        // log.debug('TEST', 'price leve update')
                        // curRec.setCurrentSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'price',
                        //     value: 8
                        // })
                        //
                        var actualPrice1 = 0;
                        var actualPrice2 = 0;
                        var actualPrice3 = 0;
                        if (pharmaPricePriceLevel1 == 8) {
                            actualPrice1 = pharmaCalc
                        } else if (pharmaPricePriceLevel1 == 9) {
                            actualPrice1 = phamarCalc1
                        } else {
                            actualPrice1 = pharmaCalc2
                        }

                        if (pharmaPricePriceLevel2 == 8) {
                            actualPrice2 = pharmaCalc
                        } else if (pharmaPricePriceLevel2 == 9) {
                            actualPrice2 = phamarCalc1
                        } else {
                            actualPrice2 = pharmaCalc2
                        }

                        if (pharmaPricePriceLevel3 == 8) {
                            actualPrice3 = pharmaCalc
                        } else if (pharmaPricePriceLevel3 == 9) {
                            actualPrice3 = phamarCalc1
                        } else {
                            actualPrice3 = pharmaCalc2
                        }
                        log.debug('Actual Price1 ' + actualPrice1)
                        log.debug('Actual Price2 ' + actualPrice2)
                        log.debug('Actual Price3 ' + actualPrice3)
                        if (PHARMAPRICINGORDER) {
                            if (actualPrice1 > 0) {
                                log.debug('Entering Pharma Calc')

                                curRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: pharmaPricePriceLevel1
                                })


                            } else if (actualPrice2 > 0) {
                                curRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: pharmaPricePriceLevel2
                                });
                            } else {
                                curRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: pharmaPricePriceLevel3
                                });
                            }
                        }

                    }
                }
            }
        }

        function lineInit(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            if (sublistName === 'item')
                console.log('log init Return Request Id ' + currentRecord.id)
            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_rr_id',
                value: currentRecord.id
            });
        }

        function saveRecord(context) {
            var curRec = context.currentRecord;

            // for (var i = 0; i < curRec.getLineCount('item'); i++) {
            //     curRec.selectLine({
            //         sublistId: 'item',
            //         line: i
            //     });
            //     var pricingPolicy = curRec.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_kd_pricing_policy'
            //     });
            //     var processing = curRec.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: FLD_RET_REQ_IT_PROCESSING
            //     });
            //     var weight = curRec.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'custcol_kd_weight'
            //     });
            //     var quantity = curRec.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'quantity'
            //     });
            //     weight ? totalItemWeight = weight * quantity : 0
            //
            //     if (pricingPolicy) {
            //
            //         var pricingPolicyRec = record.load({
            //             type: 'customrecord_kd_pricingpolicy',
            //             id: pricingPolicy
            //         })
            //         var nonReturnableRate = pricingPolicyRec.getValue('custrecord_kd_nonreturnrate')
            //         console.log('Non returnable rate ' + nonReturnableRate)
            //         if (nonReturnableRate && processing === PROCESSING_DESTRUCTION) {
            //             var weightFee = 0;
            //             var qtyFee = 0;
            //             if (phamarCalc1 > 0) {
            //                 qtyFee = (nonReturnableRate / 100) * (phamarCalc1 * quantity)
            //                 weightFee = (nonReturnableRate / 100) * (phamarCalc1 * totalItemWeight)
            //             } else {
            //                 qtyFee = (nonReturnableRate / 100) * (pharmaCalc2 * quantity)
            //                 weightFee = (nonReturnableRate / 100) * (pharmaCalc2 * totalItemWeight)
            //             }
            //             console.log('Non returnable Weight Fee: ' + weightFee)
            //             console.log('Non returnable QTY Fee: ' + qtyFee)
            //
            //             curRec.setCurrentSublistValue({
            //                 sublistId: 'item',
            //                 fieldId: 'custcol_kd_non_returnable_fee_qty',
            //                 value: qtyFee
            //             })
            //             curRec.setCurrentSublistValue({
            //                 sublistId: 'item',
            //                 fieldId: 'custcol_kd_non_returnable_fee_weight',
            //                 value: weightFee
            //             })
            //             //  alert('QTY FEE ' + weightFee)
            //
            //
            //         }
            //     }
            //     curRec.commitLine({
            //         sublistId: 'item'
            //     })
            // }
            //  return true;
            console.log('Transtatus ', curRec.getValue('transtatus'))
            if (curRec.getValue('transtatus') == 'F' || curRec.getValue('transtatus') == PENDINGVERIFICATION) {
                var NONRETURNABLE = 1
                var returnableItemCount = false;
                for (var i = 0; i < curRec.getLineCount('item'); i++) {
                    var item = curRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var pharmaProcessing = curRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_rqstprocesing',
                        line: i
                    });
                    log.debug('PharmaProcessing: ', pharmaProcessing)
                    if (pharmaProcessing == NONRETURNABLE) {
                        returnableItemCount = true
                    }
                    log.debug('item', item)
                    if (item == 626 || item == 627 || item == 628) {
                        curRec.setValue({
                            fieldId: 'custbody_kd_actual_item_scan_input',
                            value: false
                        })
                    } else {
                        curRec.setValue({
                            fieldId: 'custbody_kd_actual_item_scan_input',
                            value: true
                        })
                    }
                }
                console.log('returnableItemCount: ' + returnableItemCount)
                if (returnableItemCount == true && curRec.getValue('custbody_kd_total_item_weight') == "") {
                        alert('Please enter TOTAL ITEM WEIGHT')

                    return false

                } else {
                    return true
                }
            }


            return true;
        }


        return {
            pageInit: pageInit,
            lineInit: lineInit,
            //postSourcing: postSourcing,
            saveRecord: saveRecord

        };

    });
