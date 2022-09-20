/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/currentRecord'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search, currentRecord) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        function fieldChanged(scriptContext) {

        }

        function applyFeeQty() {
            alert('Applying Fee based on quantity please wait')
            try {
                var currentRec = record.load({
                    type: 'invoice',
                    id: currentRecord.get().id,
                    isDynamic: true,
                });
                var non_returnable_fee_qty = 0;
                for (var i = 0; i < currentRec.getLineCount('item'); i++){
                    currentRec.selectLine({
                        sublistId: 'item',
                        line: i
                    });
                    var itemId = currentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });

                    if(itemId == 207){

                        non_returnable_fee_qty = currentRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_kd_non_returnable_fee_qty'
                        })

                        currentRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: non_returnable_fee_qty,
                            ignoreFieldChange: true
                        })
                        currentRec.commitLine('item')
                    }
                    else {
                      
                        currentRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: 0,
                            ignoreFieldChange: true
                        })
                        currentRec.commitLine('item')
                    }

                }
                // for (var i = 0; i < currentRec.getLineCount('item'); i++) {
                //     currentRec.selectLine({
                //         sublistId: 'item',
                //         line: i
                //     });
                //     var pricingPolicy = currentRec.getCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'custcol_kd_pricing_policy'
                //     });
                //     var itemId = currentRec.getCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'item'
                //     });
                //     var quantity = currentRec.getCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'quantity'
                //     });
                //
                //     currentRec.setCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'price',
                //         value: 9
                //     })
                //     var pharmaSysCalc = currentRec.getCurrentSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'rate'
                //     })
                //     if (pharmaSysCalc < 0) {
                //         currentRec.setCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'price',
                //             value: 10
                //         })
                //         pharmaSysCalc = currentRec.getCurrentSublistValue({
                //             sublistId: 'item',
                //             fieldId: 'rate'
                //         })
                //     }
                //     console.log('pharmaSysCalc ' + pharmaSysCalc)
                //     if (pricingPolicy) {
                //
                //         var pricingPolicyRec = record.load({
                //             type: 'customrecord_kd_pricingpolicy',
                //             id: pricingPolicy
                //         })
                //         var nonReturnableRate = pricingPolicyRec.getValue('custrecord_kd_nonreturnrate')
                //         if (nonReturnableRate) {
                //
                //             console.log('Non returnable rate ' + nonReturnableRate)
                //             var qtyFee = (nonReturnableRate / 100) * (pharmaSysCalc * quantity)
                //             // alert('QTY FEE ' + qtyFee)
                //             currentRec.setCurrentSublistValue({
                //                 sublistId: 'item',
                //                 fieldId: 'amount',
                //                 value: qtyFee.toFixed(2),
                //                 ignoreFieldChange: true
                //             })
                //             currentRec.commitLine('item')
                //         }
                //     }
                // }
                var recId = currentRec.save();
                console.log('Rec Id ', recId)
                location.reload();

            } catch (e) {
                log.error(e.message)
            }
        }

        function applyFeeWeight() {
            alert('Applying Fee based on weight please wait')
            try {
                var currentRec = record.load({
                    type: 'invoice',
                    id: currentRecord.get().id,
                    isDynamic: true,
                });
                var non_returnable_fee_weight = 0;
                for (var i = 0; i < currentRec.getLineCount('item'); i++){
                         currentRec.selectLine({
                             sublistId: 'item',
                             line: i
                         });
                         var itemId = currentRec.getCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'item'
                         });
                         if(itemId == 207){

                             non_returnable_fee_weight = currentRec.getCurrentSublistValue({
                                      sublistId: 'item',
                                      fieldId: 'custcol_kd_non_returnable_fee_weight'
                                  })

                             currentRec.setCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'amount',
                                 value: non_returnable_fee_weight,
                                 ignoreFieldChange: true
                             })
                             currentRec.commitLine('item')
                         }else if(itemId !== 207){

                             currentRec.setCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'amount',
                                 value: 0,
                                 ignoreFieldChange: true
                             })
                             currentRec.commitLine('item')
                         }

                }

               // currentRec.setValue({fieldId: 'total', value: non_returnable_fee_weight})
               //  for (var i = 0; i < currentRec.getLineCount('item'); i++) {
               //      currentRec.selectLine({
               //          sublistId: 'item',
               //          line: i
               //      });
               //      var pricingPolicy = currentRec.getCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'custcol_kd_pricing_policy'
               //      });
               //      var itemId = currentRec.getCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'item'
               //      });
               //      var weight = currentRec.getCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'custcol_kd_weight'
               //      });
               //      var quantity = currentRec.getCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'quantity'
               //      });
               //      weight ?  totalItemWeight = weight*quantity : 0
               //
               // //  alert("total Item weigh is " + totalItemWeight)
               //      currentRec.setCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'price',
               //          value: 9
               //      })
               //      var pharmaSysCalc = currentRec.getCurrentSublistValue({
               //          sublistId: 'item',
               //          fieldId: 'rate'
               //      })
               //      if (pharmaSysCalc < 0) {
               //          currentRec.setCurrentSublistValue({
               //              sublistId: 'item',
               //              fieldId: 'price',
               //              value: 10
               //          })
               //          pharmaSysCalc = currentRec.getCurrentSublistValue({
               //              sublistId: 'item',
               //              fieldId: 'rate'
               //          })
               //      }
               //      console.log('pharmaSysCalc ' + pharmaSysCalc)
               //      if (pricingPolicy) {
               //
               //          var pricingPolicyRec = record.load({
               //              type: 'customrecord_kd_pricingpolicy',
               //              id: pricingPolicy
               //          })
               //          var nonReturnableRate = pricingPolicyRec.getValue('custrecord_kd_nonreturnrate')
               //          if (nonReturnableRate) {
               //
               //              console.log('Non returnable rate ' + nonReturnableRate)
               //              var weightFee = (nonReturnableRate / 100) * (pharmaSysCalc * totalItemWeight)
               //             alert('QTY FEE ' + weightFee)
               //              currentRec.setCurrentSublistValue({
               //                  sublistId: 'item',
               //                  fieldId: 'amount',
               //                  value: weightFee.toFixed(2),
               //                  ignoreFieldChange: true
               //              })
               //              currentRec.commitLine('item')
               //          }
               //      }
               //  }
                var recId = currentRec.save();
                location.reload();

            } catch (e) {
                log.error(e.message)
            }

        }

        return {

            fieldChanged: fieldChanged,
            applyFeeQty: applyFeeQty,
            applyFeeWeight: applyFeeWeight

        };

    });
