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
        const PRICELOCKED = 12
        const beforeLoad = (context) => {
            log.debug(context.newRecord.getValue('custrecord_kod_mr_status'))
            context.form.clientScriptFileId = 18880;
            if( context.newRecord.getValue('custrecord_kod_mr_status') == PRICELOCKED){
                let buttonName = ''
                let useQuantityBasedFee = context.newRecord.getValue('custrecord_kd_use_quantity_based_fee')
                log.debug('useQuantityBasedFee', useQuantityBasedFee)
                buttonName = useQuantityBasedFee === 'T' || useQuantityBasedFee === true ? 'Use Weight Based Fee' : 'Use Quantity Based Fee'
                log.debug('buttonName', buttonName)

                context.form.addButton({
                    id: 'custpage_btn_fee',
                    label: buttonName,
                    functionName: 'mrrSelectFee'

                })
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
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
