/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
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
            if (context.type == 'create')
                return;
            var retReq
            var taskRec = context.newRecord;
            log.debug('Task Rec ', taskRec)
            var returnReqId = taskRec.getValue('custevent_kd_ret_req')
            log.debug('Return Request Id ', returnReqId)
            var status = taskRec.getValue('status')
            if (returnReqId) {
                retReq = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: returnReqId,
                    isDynamic: true

                })
                var retReqStatus = retReq.getValue('transtatus')
                  log.debug('Ret Req ' , retReqStatus)




                if (retReqStatus == 'J' && status == 'COMPLETE') {
                    log.debug('Status is  ', status)
                   
                    var id = record.submitFields({
                        type: 'customsale_kod_returnrequest',
                        id: returnReqId,
                        values: { 'transtatus': 'D'},
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    })


                }

            }


        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
