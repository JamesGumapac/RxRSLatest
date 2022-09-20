/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    /**
     * @param{record} record
     */

    (record) => {
        function createItemPriceHistory(itemid,pricelevel,oldprice, newprice){
          var hisRec =  record.create({
                type: 'customrecord_kd_price_history',
                isDynamic: true
            })
            hisRec.setValue({
                fieldId: 'custrecord_kd_price',
                value: oldprice
            })
            log.debug('new price ', newprice)
            hisRec.setValue({
                fieldId: 'custrecord_kd_new_price',
                value: newprice
            })
            hisRec.setValue({
                fieldId: 'custrecord_kd_price_type',
                value: pricelevel
            })
            hisRec.setValue({
                fieldId: 'custrecord_kd_item',
                value: itemid
            })
        var hisrecId = hisRec.save();
          log.debug('HisRec Id ' , hisrecId)
        }
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
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
            var UnitPrice = 2;
            var WAC = 1;
            var PharmaCred = 9
            var PharmaCredErv = 10


            var oldRec = context.oldRecord;
            var newRec = context.newRecord;
            var itemId = newRec.id
            // log.debug('New Rec', newRec)
            // log.debug('Old Rec ', oldRec)
            if(oldRec){
                var oldWacprice = oldRec.getSublistValue({
                    sublistId: 'price1',
                    fieldId: 'price_1_',
                    line: 0
                })
                var oldPharmaCredit = oldRec.getSublistValue({
                    sublistId: 'price1',
                    fieldId: 'price_1_',
                    line: 4
                })
                var oldPharmaCreditErv = oldRec.getSublistValue({
                    sublistId: 'price1',
                    fieldId: 'price_1_',
                    line: 3
                })
                var oldUnitPrice = oldRec.getSublistValue({
                    sublistId: 'price1',
                    fieldId: 'price_1_',
                    line: 6
                })
                log.debug('Old WAC Price ' + oldWacprice + ' Old Pharma Credit Price ' + oldPharmaCredit + ' Old Unit Price ' + oldUnitPrice)

            }

            var newWacprice = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 0
            })
            var newPharmaCreditErv = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 3
            })
            var newPharmaCredit = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 4
            })
            var newUnitPrice = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 6
            })
            log.debug('New WAC Price ' + newWacprice + ' new Pharma Credit Price ' + newPharmaCredit + ' new Unit Price ' + newUnitPrice)
          if(oldWacprice){
              if(oldWacprice != newWacprice){
                  createItemPriceHistory(itemId,WAC,oldWacprice,newWacprice)
              }
          }
            if(oldUnitPrice){
                if(oldUnitPrice != newUnitPrice){
                    createItemPriceHistory(itemId,UnitPrice,oldUnitPrice,newUnitPrice)
                }
            }
            if(oldPharmaCredit){
                if(oldPharmaCredit != newPharmaCredit){
                    createItemPriceHistory(itemId,PharmaCred,oldPharmaCredit,newPharmaCredit)
                }
            }
            if(oldPharmaCreditErv){
                if(oldPharmaCreditErv != newPharmaCreditErv){
                    createItemPriceHistory(itemId,PharmaCredErv,oldPharmaCreditErv,newPharmaCreditErv)
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
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
