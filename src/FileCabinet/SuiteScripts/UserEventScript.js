/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    /**
     * @param{record} record
     */
    (record) => {
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
            var oldRec = context.oldRecord;
            var newRec = context.newRecord;
            log.debug('New Rec', newRec)
            log.debug('Old Rec ', oldRec)

            var oldWacprice = oldRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 0
            })
            var oldPharmaCredit = oldRec.getSublistValue({
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

            var newWacprice = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 0
            })
            var newPharmaCredit = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 3
            })
            var newUnitPrice = newRec.getSublistValue({
                sublistId: 'price1',
                fieldId: 'price_1_',
                line: 6
            })
            log.debug('New WAC Price ' + newWacprice + ' new Pharma Credit Price ' + newPharmaCredit + ' new Unit Price ' + newUnitPrice)

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
