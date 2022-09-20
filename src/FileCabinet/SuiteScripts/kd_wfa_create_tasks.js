/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/runtime','N/search'],
    /**
 * @param{record} record
     *  @param{record} search
 */
    (record,runtime,search) => {
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
            var rec = context.newRecord;
            var id = rec.id;
            log.debug('Id')
            var objScript = runtime.getCurrentScript();
            var strType = objScript.getParameter('custscript_kd_type');
            var extId = rec.getValue('tranid')



            if(strType == 'salesorder'){
                log.debug('Creating Task for RMA #')
                var taskRec = record.create({
                    type: record.Type.TASK
                })
                taskRec.setValue({
                    fieldId: 'title',
                    value: 'Requesting RMA # for ' + extId
                })
                taskRec.setValue({
                    fieldId: 'message',
                    value: 'Requesting for RMA #'
                })
                taskRec.setValue({
                    fieldId: 'assigned',
                    value: runtime.getCurrentUser().id
                })

                var taskId = taskRec.save()
                log.debug('task id ', taskId)
            }else {

                var taskSearchObj = search.create({
                    type: "task",
                    filters:
                        [
                            ["custevent_kd_ret_req", "anyof", id]
                        ],
                    columns:
                        [search.createColumn({name: "internalid", label: "internalid"}),
                            search.createColumn({
                                name: "custevent_kd_222_form_generated",
                                label: "All 222 Form Generated?"
                            }),
                            search.createColumn({name: "custevent_kd_ret_req", label: "Return Request Id"})
                        ]
                });
                var searchResultCount = taskSearchObj.runPaged().count;
                if (searchResultCount < 0) {
                    var taskRec = record.create({
                        type: record.Type.TASK
                    })
                    taskRec.setValue({
                        fieldId: 'title',
                        value: extId
                    })
                    taskRec.setValue({
                        fieldId: 'message',
                        value: 'Print labels and form 222'
                    })
                    taskRec.setValue({
                        fieldId: 'assigned',
                        value: runtime.getCurrentUser().id
                    })
                    taskRec.setValue({
                        fieldId: 'custevent_kd_ret_req',
                        value: id
                    })
                    var taskId = taskRec.save()
                    log.debug('task id ', taskId)
                }
            }
        }

        return {onAction};
    });
