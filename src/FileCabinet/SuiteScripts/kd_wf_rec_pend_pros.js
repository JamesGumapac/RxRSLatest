/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/search'],
    /**
     * @param{currentRecord} currentRecord
     */
    (record,search) => {
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
        const onAction = (scriptContext) => {
            var NUMBER_OF_NOT_MODIFIED = 0;
            log.debug({
                title: 'Start Script'
            });
            var currentRecord = scriptContext.newRecord;
            var lineCount = currentRecord.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < lineCount; i++) {

                log.debug({title: 'line', details: lineCount})
                var item = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })

                var fieldLookUp = search.lookupFields({
                    type: search.Type.ITEM,
                    id: item, //pass the id of the item here
                    columns: 'islotitem'
                });

                var islotitem = fieldLookUp.islotitem;
                log.debug({title: 'islotitem', details: islotitem})
                    if(islotitem == true){
                        inventoryDetailSubrecord = currentRecord.getSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: i
                        });
                        log.debug({title: 'subrec', details: inventoryDetailSubrecord})
                        var invcount = inventoryDetailSubrecord.getLineCount({
                            sublistId: 'inventoryassignment'
                        });
                        log.debug({title: 'inventory details count', details: invcount})

                        if(invcount){
                            for (var j = 0; j <invcount; j++) {
                                var LOTNUMBER = inventoryDetailSubrecord.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    line: j
                                })
                                log.debug({title: 'LOTNUMBER', details:LOTNUMBER})
                                if(LOTNUMBER  === "" || LOTNUMBER === 'multiple'){
                                    NUMBER_OF_NOT_MODIFIED = NUMBER_OF_NOT_MODIFIED + 1;
                                    log.debug('NUMBER_OF_NOT_MODIFIED', NUMBER_OF_NOT_MODIFIED)
                                }
                            }

                        }



                    }
            }
            return parseInt(NUMBER_OF_NOT_MODIFIED)
        }

        return {onAction};
    });
