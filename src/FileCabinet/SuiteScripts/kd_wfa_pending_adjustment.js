/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', 'N/redirect', 'N/runtime'],
    /**
     * @param{record} record
     * @param{url} url
     */
    (record, redirect,runtime) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (context) => {
            var objScript = runtime.getCurrentScript();
            var strType = objScript.getParameter('custscript_kd_rec_type');
            if (strType == 'masterreturn') {
                var mrRec = context.newRecord;
                var status = mrRec.getValue('custrecord_kod_mr_status')
                var mrId = context.newRecord.id;
                log.debug('MrId', mrId)
                if (mrId) {

                    var mrrNewRec = record.load({
                        type: 'customrecord_kod_masterreturn',
                        id: mrId
                    })
                    mrrNewRec.setValue({
                        fieldId: 'custrecord_kod_mr_status',
                        value: 9
                    })
                    mrrNewRec.setValue({
                        fieldId: 'custrecord_kd_ready_for_approval',
                        value: false
                    })
                    mrrNewRec.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    })
                    log.debug('mrrNewRec ', mrrNewRec)
                }


                redirect.toRecord({
                    type: 'customrecord_kod_masterreturn',
                    id: mrId,
                    parameters: {
                        'e': 'T'
                    }
                });

            }


            if (strType === 'returnrequest') {
                log.debug('Enter Return Request')
                var RRId = record.submitFields({
                    type: 'customsale_kod_returnrequest',
                    id: context.newRecord.id,
                    values: {

                        'transtatus' : 'F'
                    }
                });
            }
            redirect.toRecord({
                type: 'customsale_kod_returnrequest',
                id: context.newRecord.id,
                parameters: {
                    'e': 'T'
                }
            });



        }

        return {onAction};
    });
