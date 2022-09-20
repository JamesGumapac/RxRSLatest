/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currentRecord', 'N/search', 'N/record'],
    /**
     * @param{currentRecord} currentRecord
     * @param{search} search
     */
    (currentRecord, search, record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const RETURNABLE = 2
        const NONRETURNABLE = 1
        const calcaulateWeighBasedFee = (basedDestructionFee, pricePerPound, totalItemWeight, freeOfChargeItemWeight) => {
            let totalWeightBasedFee = 0;
            log.debug('totalItemWeight', totalItemWeight)
            log.debug('freeOfChargeItemWeight', freeOfChargeItemWeight)
            if (totalItemWeight > freeOfChargeItemWeight) {
                totalWeightBasedFee = ((+totalItemWeight - +freeOfChargeItemWeight) * +pricePerPound) + +basedDestructionFee
            } else {
                totalWeightBasedFee = basedDestructionFee
            }
            log.debug('totalWeightBasedFee', totalWeightBasedFee)
            return totalWeightBasedFee
        }
        const RRAPPROVEDCOUNT = 'customsearch_kd_rr_approved_count'
        const setMrrtoWaitingApproval = (mmrId) => {
            let approvedCount = 0;
            let rrApprovedCount = search.load({
                id: RRAPPROVEDCOUNT
            })
            rrApprovedCount.filters.push(search.createFilter({
                name: 'custbody_kd_master_return_id',
                operator: 'anyof',
                values: mmrId
            }));

            let mrrRec = record.load({
                type: 'customrecord_kod_masterreturn',
                id: mmrId,
                isDynamic: true
            })
            let mrrStatus = mrrRec.getValue('custrecord_kod_mr_status')

            log.debug('MRR status: ' + mrrStatus)
            let searchCount = rrApprovedCount.runPaged().count;
            rrApprovedCount.run().each(function (result) {
                let status = result.getValue({name: 'statusref'})
                log.debug('status', status)
                if (status == 'statusI')
                    approvedCount += 1
                return true;
            });
            log.debug('Count of approved', approvedCount)
            log.debug('Count of RRRec', searchCount)
            if (approvedCount === searchCount && mrrStatus == 14) {
                log.debug(`Setting MRR ${mmrId} Status to waiting for Approval`);
                try {
                    let mrrIdRec = record.submitFields({
                        type: 'customrecord_kod_masterreturn',
                        id: mmrId,
                        values: {
                            'custrecord_kod_mr_status': 8
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                } catch (e) {
                    log.error(e.message, mrrIdRec)
                }

            }


        }
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (context) => {
            var NONRETURNABLE = 1
            let returnableItemCount = false
            let total_item_weight = 0;
            let basedDestructionFee = 0;
            let pricePerPound = 0;
            let freeOfChargeItemWeight = 0;
            let TOTALITEMWEIGHTFEE = 0;
            var currentRecord = context.newRecord;
            var lineCount = currentRecord.getLineCount({
                sublistId: 'item'
            });

            log.debug('lineCount', lineCount);
            var entity = currentRecord.getValue('entity')
            //Get the weight Based Rate on the Customer Record

            log.debug('processing', processing);
            for (let i = 0; i < lineCount; i++) {
                log.debug('line ', i)
                var item = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })
                log.debug('Item Id', item);
                var quantity = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                })
                var pharmaProcessing = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kod_rqstprocesing',
                    line: i
                });
                log.debug('PharmaProcessing: ', pharmaProcessing)
                if (pharmaProcessing == NONRETURNABLE) {
                    returnableItemCount = true
                }
                log.debug('Quantity', quantity);
                var fieldLookUp = search.lookupFields({
                    type: search.Type.ITEM,
                    id: item, //pass the id of the item here
                    columns: 'islotitem'
                });
                var islotitem = fieldLookUp.islotitem;

                if (context.type == context.UserEventType.CREATE) {

                    // if(islotitem == true){
                    //     log.debug('Is lot Item', 'True')
                    //
                    //     inventoryDetailSubrecord = currentRecord.getSublistSubrecord({
                    //         sublistId: 'item',
                    //         fieldId: 'inventorydetail',
                    //         line: i
                    //     });
                    //     log.debug('subrec', inventoryDetailSubrecord);
                    //
                    //
                    //
                    //     inventoryDetailSubrecord.setSublistValue({
                    //         sublistId: 'inventoryassignment',
                    //         fieldId: 'receiptinventorynumber',
                    //         line: 0,
                    //         value: 'MULTIPLE'
                    //     });
                    //
                    //     inventoryDetailSubrecord.setSublistValue({
                    //         sublistId: 'inventoryassignment',
                    //         fieldId: 'quantity',
                    //         line: 0,
                    //         value: quantity
                    //     });
                    //
                    // }

                    var processing = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_rqstprocesing',
                        line: i
                    })
                    if (processing) {
                        /*   if (processing == 1){
                            currentRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_kod_mfgrtn',
                                line: i,
                                value: true
                            }) } */
                        if (processing == 1) {
                            currentRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_kod_mfgrtn',
                                line: i,
                                value: false
                            })
                        }
                    }
                }


            }
            log.debug('returnableItemCount', returnableItemCount)
            if (returnableItemCount == true) {
                if (entity) {
                    try {

                    var weightBasedRate = search.lookupFields({
                        type: record.Type.CUSTOMER,
                        id: entity,
                        columns: ['custentity_kd_based_destruction_fee', 'custentity_kd_price_per_pound', 'custentity_kd_free_of_chage_iw']
                    })
                    log.debug('weightBasedRate', weightBasedRate)
                    basedDestructionFee = weightBasedRate['custentity_kd_based_destruction_fee']
                    pricePerPound = weightBasedRate['custentity_kd_price_per_pound']
                    freeOfChargeItemWeight = weightBasedRate['custentity_kd_free_of_chage_iw']
                    total_item_weight = currentRecord.getValue('custbody_kd_total_item_weight')
                    TOTALITEMWEIGHTFEE = calcaulateWeighBasedFee(basedDestructionFee, pricePerPound, total_item_weight, freeOfChargeItemWeight)
                    log.debug('Before Submit TOTALITEMWEIGHTFEE', TOTALITEMWEIGHTFEE)
                    currentRecord.setValue({
                        fieldId: 'custbody_kd_total_non_returnable_fee_w',
                        value: TOTALITEMWEIGHTFEE
                    })
                    } catch (e) {
                        log.error(e.message)
                    }
                }
            }else{
                currentRecord.setValue({
                    fieldId: 'custbody_kd_total_non_returnable_fee_w',
                    value: 0
                })
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
        const afterSubmit = (scriptContext) => {
            var rec = scriptContext.newRecord
            var status = rec.getValue('transtatus')
            log.debug('After Submit', `Status: ${status}`)
            var mmrId = rec.getValue('custbody_kd_master_return_id')
            if (status === 'I') {
                setMrrtoWaitingApproval(mmrId)
            }
            if (status == 'F' || status == 'K' || status == 'E' || status == 'I') {


                log.debug('After Submit', 'status is processing or Pending Verification')
                var nonScannableFee = 0;
                let total_item_weight = 0;
                var TOTAL_NON_RETURNABLE_FEE_WEIGHT = 0;
                var TOTAL_NON_RETURNABLE_FEE_QTY = 0;
                var TOTAL_RETURNABLE_FEE_QTY = 0;
                var TOTAL_NON_SCANNABLE_FEE_WEIGHT = 0;
                var TOTAL_222_FORM_FEES = 0;
                var FLD_RET_REQ_IT_PROCESSING = 'custcol_kod_rqstprocesing';
                var NON_RETURNABLE_PRICE_LEVEL = 0;
                // var PHARMACALC = 8
                // var PHARMACALC1 = 9
                // var PHARMACALC2 = 10
                // var PHARMAPRICINGORDER;
                var totalItemWeight = 0;


                var curRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: rec.id,
                    isDynamic: true,
                });
                log.debug('Cur Rec ', curRec)
                var entity = curRec.getValue('entity')
                var form222rateObj = search.lookupFields({
                    type: record.Type.CUSTOMER,
                    id: entity,
                    columns: ['custentity_kd_form_222_rate', 'custentity_kd_non_returnable_rate', 'custentity_kd_returnable_rate']
                })

                var form222rate = form222rateObj['custentity_kd_form_222_rate']
                var nonReturnableRate = form222rateObj['custentity_kd_non_returnable_rate']
                var returnableRate = form222rateObj['custentity_kd_returnable_rate']
                let noOfC2Form = curRec.getValue('custbody_kd_no_form_222')
                if (+noOfC2Form > 0) {
                    TOTAL_222_FORM_FEES = noOfC2Form * form222rate
                }

                // try {
                //
                //
                //     for (var i = 0; i < curRec.getLineCount('item'); i++) {
                //         curRec.selectLine({
                //             sublistId: 'item',
                //             line: i
                //         });
                //         var itemId = curRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'item'
                //         });
                //
                //         var filters = new Array();
                //         filters[0] = search.createFilter({
                //             name: 'internalID',
                //             operator: search.Operator.IS,
                //             values: itemId
                //         });
                //         var columns = new Array();
                //         columns[0] = search.createColumn({
                //             name: 'custitem_kodella_pricingorder'
                //         });
                //         columns[1] = search.createColumn({
                //             name: 'price8'
                //         });
                //         columns[2] = search.createColumn({
                //             name: 'price9'
                //         });
                //         columns[3] = search.createColumn({
                //             name: 'price10'
                //         });
                //         columns[4] = search.createColumn({
                //             name: 'price'
                //         });
                //         columns[5] = search.createColumn({
                //             name: 'price'
                //         });
                //         var mySearch = search.create({
                //             type: search.Type.ITEM,
                //             filters: filters,
                //             columns: columns
                //         })
                //         var result = mySearch.run();
                //         //Price levels start with 'baseprice', then 'price' + 2 and up.
                //
                //
                //         result.each(function (row) {
                //
                //             PHARMAPRICINGORDER = row.getValue({
                //                 name: 'custitem_kodella_pricingorder'
                //             })
                //             pharmaCalc = row.getValue({
                //                 name: 'price8'
                //             })
                //             phamarCalc1 = row.getValue({
                //                 name: 'price9'
                //             })
                //             pharmaCalc2 = row.getValue({
                //                 name: 'price10'
                //             })
                //             wac = row.getValue({
                //                 name: 'price'
                //             })
                //
                //
                //             return true
                //         })
                //         var pharmaPricePriceLevel1
                //         var pharmaPricePriceLevel2
                //         var pharmaPricePriceLevel3
                //         var pharmaPriceRec;
                //
                //         if (PHARMAPRICINGORDER) {
                //             pharmaPriceRec = record.load({
                //                 type: 'customrecord_kodella_prclvlpriorder',
                //                 id: parseInt(PHARMAPRICINGORDER)
                //             })
                //             log.debug('pharmaPriceRec', pharmaPriceRec)
                //
                //         }
                //
                //         try {
                //             pharmaPricePriceLevel1 = pharmaPriceRec.getValue({
                //                 fieldId: 'custrecord_kodella_prclvl1'
                //             })
                //             pharmaPricePriceLevel2 = pharmaPriceRec.getValue({
                //                 fieldId: 'custrecord_kodella_prclvl2'
                //             })
                //             pharmaPricePriceLevel3 = pharmaPriceRec.getValue({
                //                 fieldId: 'custrecord_kodella_prclvl3'
                //             })
                //
                //         } catch (e) {
                //             log.error(e.message)
                //         }
                //
                //         log.debug('pharmaPrice1PriceLevel1: ' + pharmaPricePriceLevel1 + ' pharmaPrice1PriceLevel2: ' + pharmaPricePriceLevel2 + ' pharmaPrice1PriceLevel3: ' + pharmaPricePriceLevel3)
                //
                //         log.debug('PharmaProcessing Order ' + PHARMAPRICINGORDER)
                //         log.debug('Pharma CR value ' + pharmaCalc)
                //         log.debug('calc1 value ' + phamarCalc1)
                //         log.debug('calc2 value ' + pharmaCalc2)
                //
                //         if (pharmaPricePriceLevel1 == 8) {
                //             actualPrice1 = pharmaCalc
                //         } else if (pharmaPricePriceLevel1 == 9) {
                //             actualPrice1 = phamarCalc1
                //         } else {
                //             actualPrice1 = pharmaCalc2
                //         }
                //
                //         if (pharmaPricePriceLevel2 == 8) {
                //             actualPrice2 = pharmaCalc
                //         } else if (pharmaPricePriceLevel2 == 9) {
                //             actualPrice2 = phamarCalc1
                //         } else {
                //             actualPrice2 = pharmaCalc2
                //         }
                //
                //         if (pharmaPricePriceLevel3 == 8) {
                //             actualPrice3 = pharmaCalc
                //         } else if (pharmaPricePriceLevel3 == 9) {
                //             actualPrice3 = phamarCalc1
                //         } else {
                //             actualPrice3 = pharmaCalc2
                //         }
                //         log.debug('wac ', wac)
                //         var pricingPolicy = curRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'custcol_kd_pricing_policy'
                //         });
                //         var processing = curRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: FLD_RET_REQ_IT_PROCESSING
                //         });
                //         log.debug('Processing ', processing)
                //         var weight = curRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'custcol_kd_weight'
                //         });
                //         var quantity = curRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'quantity'
                //         });
                //         weight ? totalItemWeight = weight * quantity : 0
                //
                //         if (itemId == 649) {
                //             log.debug('Item is not scannable')
                //             log.debug('wac ', wac)
                //
                //             var nonScannableFee = 0;
                //             nonScannableFee = quantity * wac
                //             log.debug('Non scannable fee ', nonScannableFee)
                //             TOTAL_NON_SCANNABLE_FEE_WEIGHT += nonScannableFee
                //             curRec.setCurrentSublistValue({
                //                 sublistId: 'item',
                //                 fieldId: 'custcol_kd_non_scannable_fee_weight',
                //                 value: nonScannableFee
                //             })
                //
                //         }
                //         // if (pricingPolicy) {
                //         //     var pricingPolicyRec = record.load({
                //         //         type: 'customrecord_kd_pricingpolicy',
                //         //         id: pricingPolicy
                //         //     })
                //         //  var nonReturnableRate = pricingPolicyRec.getValue('custrecord_kd_nonreturnrate')
                //         log.debug('Non returnable rate ', nonReturnableRate)
                //         //    var returnableRate = pricingPolicyRec.getValue('custrecord_kd_returnrate')
                //         log.debug('returnable rate ', returnableRate)
                //
                //         log.debug('222 form rate ', form222rate)
                //
                //
                //         if (processing == 1) {
                //             log.debug('Item is not returnable')
                //             if (nonReturnableRate) {
                //                 var nonReturnablePercent = parseInt(nonReturnableRate) / 100
                //                 log.audit('nonReturnablePercent', nonReturnablePercent)
                //
                //                 var weightFee = 0;
                //                 var qtyFee = 0;
                //                 if (actualPrice1 > 0) {
                //                     qtyFee = nonReturnablePercent * (actualPrice1 * quantity)
                //                     log.audit('QTY FEE ', qtyFee)
                //                     weightFee = nonReturnablePercent * (actualPrice1 * totalItemWeight)
                //                 } else if (actualPrice2) {
                //                     qtyFee = nonReturnablePercent * (actualPrice2 * quantity)
                //                     weightFee = nonReturnablePercent * (actualPrice2 * totalItemWeight)
                //                 } else if (actualPrice3) {
                //                     qtyFee = nonReturnablePercent * (actualPrice3 * quantity)
                //                     weightFee = nonReturnablePercent * (actualPrice3 * totalItemWeight)
                //                 } else {
                //                     qtyFee = 0
                //                     weightFee = 0
                //                 }
                //
                //                 TOTAL_NON_RETURNABLE_FEE_QTY += qtyFee
                //                 TOTAL_NON_RETURNABLE_FEE_WEIGHT += weightFee
                //                 log.audit('Non returnable Weight Fee: ' + weightFee)
                //                 log.audit('Non returnable QTY Fee: ' + qtyFee)
                //
                //                 curRec.setCurrentSublistValue({
                //                     sublistId: 'item',
                //                     fieldId: 'custcol_kd_non_returnable_fee_qty',
                //                     value: qtyFee
                //                 })
                //                 curRec.setCurrentSublistValue({
                //                     sublistId: 'item',
                //                     fieldId: 'custcol_kd_non_returnable_fee_weight',
                //                     value: weightFee
                //                 })
                //
                //
                //             }
                //         }
                //         if (processing == 2) {
                //             log.debug('Item is returnable')
                //             if (returnableRate) {
                //                 var returnableRatePercent = parseInt(returnableRate) / 100
                //                 var returnableQtyFee = 0;
                //                 if (actualPrice1 > 0) {
                //                     returnableQtyFee = returnableRatePercent * (actualPrice1 * quantity)
                //
                //                 } else if (actualPrice2) {
                //                     returnableQtyFee = returnableRatePercent * (actualPrice2 * quantity)
                //
                //                 } else if (actualPrice3) {
                //                     returnableQtyFee = returnableRatePercent * (actualPrice3 * quantity)
                //
                //                 } else {
                //                     returnableQtyFee = 0;
                //                 }
                //                 TOTAL_RETURNABLE_FEE_QTY += returnableQtyFee
                //
                //
                //                 log.audit('Non returnable QTY Fee: ' + returnableQtyFee)
                //
                //
                //                 curRec.setCurrentSublistValue({
                //                     sublistId: 'item',
                //                     fieldId: 'custcol_kd_returnable_fee',
                //                     value: returnableQtyFee
                //                 })
                //
                //
                //             }
                //         }
                //         log.debug('item Id is', itemId)
                //
                //         //   }
                //         curRec.commitLine({
                //             sublistId: 'item'
                //         })
                //
                //     }
                // } catch (e) {
                //     log.error(e.message)
                // }
                try {

                    for (var i = 0; i < curRec.getLineCount('item'); i++) {
                        curRec.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        var itemId = curRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });
                        var amount = curRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount'
                        });

                        var processing = curRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: FLD_RET_REQ_IT_PROCESSING
                        });
                        log.debug('Processing ', processing)

                        var quantity = curRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        });


                        if (itemId == 649) {
                            log.debug('Item is not scannable')
                            var filters = new Array();
                            filters[0] = search.createFilter({
                                name: 'internalID',
                                operator: search.Operator.IS,
                                values: itemId
                            });
                            var columns = new Array();
                            columns[0] = search.createColumn({
                                name: 'price11'
                            });

                            var mySearch = search.create({
                                type: search.Type.ITEM,
                                filters: filters,
                                columns: columns
                            })
                            var result = mySearch.run();


                            result.each(function (row) {

                                NON_RETURNABLE_PRICE_LEVEL = row.getValue({
                                    name: 'price11'
                                })

                                return true
                            })
                            log.debug('NON_RETURNABLE_PRICE_LEVEL', NON_RETURNABLE_PRICE_LEVEL)

                            nonScannableFee = +quantity * +NON_RETURNABLE_PRICE_LEVEL
                            log.audit('Non scannable fee ', nonScannableFee)
                            TOTAL_NON_SCANNABLE_FEE_WEIGHT += nonScannableFee

                            curRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_kd_rr_fees',
                                value: +nonScannableFee
                            })

                        }


                        if (processing == NONRETURNABLE && itemId != 649) {
                            log.debug('Item is not returnable')

                            if (nonReturnableRate) {
                                var nonReturnablePercent = parseInt(nonReturnableRate) / 100
                                log.audit('Formula for non returnable', `nonReturnablePercent  ${nonReturnablePercent}   amount  ${amount}`)

                                var qtyFee = 0;
                                qtyFee = nonReturnablePercent * +amount
                                log.audit('Non returnable QTY Fee: ' + qtyFee)
                                TOTAL_NON_RETURNABLE_FEE_QTY += qtyFee

                                curRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_kd_rr_fees',
                                    value: qtyFee
                                })


                            }
                        }
                        if (processing == RETURNABLE) {
                            log.debug('Item is returnable')
                            if (returnableRate) {

                                var returnableRatePercent = parseInt(returnableRate) / 100
                                var returnableQtyFee = 0;
                                log.debug('returnableRatePercent: ' + returnableRatePercent)
                                returnableQtyFee = returnableRatePercent * +amount


                                TOTAL_RETURNABLE_FEE_QTY += returnableQtyFee
                                log.debug('TOTAL_RETURNABLE_FEE_QTY ', TOTAL_RETURNABLE_FEE_QTY)

                                log.audit('Returnable QTY Fee: ' + returnableQtyFee)


                                curRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_kd_rr_fees',
                                    value: returnableQtyFee
                                })


                            }
                        }


                        //   }
                        curRec.commitLine({
                            sublistId: 'item'
                        })

                    }
                } catch (e) {
                    log.error(e.message)
                }
                try {


                    curRec.setValue({
                        fieldId: 'custbody_kd_total_non_returnable_qty',
                        value: TOTAL_NON_RETURNABLE_FEE_QTY
                    })

                    // curRec.setValue({
                    //     fieldId: 'custbody_kd_total_non_returnable_fee_w',
                    //     value: TOTALITEMWEIGHTFEE
                    // })

                    curRec.setValue({
                        fieldId: 'custbody_kd_total_non_scannable_w',
                        value: TOTAL_NON_SCANNABLE_FEE_WEIGHT
                    })

                    curRec.setValue({
                        fieldId: 'custbody_kd_total_returnable_fee_qty',
                        value: TOTAL_RETURNABLE_FEE_QTY
                    })

                    curRec.setValue({
                        fieldId: 'custbody_kd_total_222_form_fee',
                        value: TOTAL_222_FORM_FEES
                    })

                    var id = curRec.save()
                } catch (e) {
                    log.error(e.message)
                }

                log.debug('Id ', id)
                var MRRID = curRec.getValue('custbody_kd_master_return_id')
                try {
                    if (MRRID) {
                        var mrr222TotalFormFee = 0;
                        var mrrNonReturnableQtyTotal = 0;
                        var mrrNonReturnableWeightTotal = 0;
                        var mrrReturnableQtyTotal = 0;
                        var mrrNonScannableWeightTotal = 0;
                        var rrAggreFeeSearchOnj = search.load({
                            id: 'customsearch_kd_rr_aggree_fee'
                        })


                        rrAggreFeeSearchOnj.filters.push(search.createFilter({
                            name: 'custbody_kd_master_return_id',
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

        }

        return {beforeSubmit, afterSubmit}

    });
