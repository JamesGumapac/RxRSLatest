/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
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
            log.debug({
                title: 'Start Script'
            });
            var currentRecord = scriptContext.newRecord;
            var ISPROCESSED = 0;

            var ALLOW_TO_COMPLETE_PROCESS = 'custbody_kd_allow_to_com_proc';
            var Approved_for_Processing = 'custbody_kd_app_for_proc';

            if (scriptContext.type != scriptContext.UserEventType.CREATE && currentRecord.getValue('transtatus') === 'E') {
                var NUMBER_OF_NOT_MODIFIED = 0;
                log.debug({title: 'NUMBER_OF_NOT_MODIFIED', details: NUMBER_OF_NOT_MODIFIED})

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
                    if (islotitem == true) {
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

                        if (invcount) {
                            for (var j = 0; j < invcount; j++) {
                                var LOTNUMBER = inventoryDetailSubrecord.getSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    line: j
                                })
                                log.debug({title: 'LOTNUMBER', details: LOTNUMBER})
                                if (LOTNUMBER === "" || LOTNUMBER === 'MULTIPLE') {
                                    NUMBER_OF_NOT_MODIFIED = NUMBER_OF_NOT_MODIFIED + 1;
                                    log.debug('NUMBER_OF_NOT_MODIFIED', NUMBER_OF_NOT_MODIFIED)
                                    alert('Please rectify the inventory details first to proceed on processing stage.')
                                }
                                if (NUMBER_OF_NOT_MODIFIED === 0) {
                                    currentRecord.setValue({
                                        fieldId: 'custbody_kd_app_for_proc',
                                        value: true
                                    })
                                } else if (NUMBER_OF_NOT_MODIFIED > 0) {
                                    currentRecord.setValue({
                                        fieldId: 'custbody_kd_app_for_proc',
                                        value: false
                                    })
                                }
                            }

                        }

                    }
                }

            }
            if (scriptContext.type != scriptContext.UserEventType.CREATE && currentRecord.getValue('transtatus') === 'F') {
                log.debug({title: 'Complete Processing checking'})
                var lineCount = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                for (var i = 0; i < lineCount; i++) {
                    var processing = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_rqstprocesing',
                        line: i
                    })
                    var processingvalue = currentRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_rqstprocesing',
                        line: i
                    })
                    log.debug({title: 'processing value for ', details: `line ${i} : ${processingvalue}`})
                    if (!processing) {
                        log.debug('Approved for processing')
                        ISPROCESSED = ISPROCESSED + 1;
                        log.debug('ISPROCESSED', ISPROCESSED)
                    }
                    if (ISPROCESSED === 0) {
                        currentRecord.setValue({
                            fieldId: 'custbody_kd_allow_to_com_proc',
                            value: true
                        })
                    } else {
                        log.debug('Uncheck Approved for Processing')
                        currentRecord.setValue({
                            fieldId: 'custbody_kd_allow_to_com_proc',
                            value: false
                        });
                    }
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
