/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     *  @param{search} search
     */
    (record, runtime, search) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */


        const getInputData = (inputContext) => {
            const currentScript = runtime.getCurrentScript();
            const rrId = currentScript.getParameter({
                name: "custscript_return_request_id",
            });
            var returnRequest = search.load({
                id: 'customsearchkd_create_item_processed'
            })
            returnRequest.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: rrId
            }));


            return returnRequest

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */
        function isDefinedNotNullNotEmpty(obj) {
            return typeof obj != 'undefined' && obj != null && obj != '' && obj.length > 0;
        }

        const createItemProcessedRecord = (objectToProcess) => {
            log.debug('Object to Process length: ', objectToProcess.length)
            let itemProcessedRec = record.create({
                type: 'customrecord_kod_mr_item_process',
                isDynamic: true
            })


            if (objectToProcess.length > 0) {
                var keys = Object.keys(objectToProcess[0])
                var values = Object.values(objectToProcess[0])


                try {
                    for (let i in keys) {
                    if(values[i] == "" ){ continue }

                        itemProcessedRec.setValue({
                            fieldId: 'custrecord_' + keys[i],
                            value: values[i]
                        })

                        log.debug('custrecord_' + keys[i], itemProcessedRec.getValue('custrecord_' + keys[i]))


                        //log.debug('Value is ', isDefinedNotNullNotEmpty(Object.values(objectToProcess)))


                    }
                } catch (e) {
                    log.error(e.message)
                }
            }
            var itemProcRecId = itemProcessedRec.save({
                ignoreMandatoryFields: true
            })
            log.debug('itemProcRecId:', itemProcRecId)

        }
        const map = (context) => {
            const currentScript = runtime.getCurrentScript();
            let i = 0;

            try {
                let searchResult = JSON.parse(context.value);
                log.debug('Search Result', searchResult)


                let item = ""
                let description = ""
                let NDC = ""
                let quantity = 0
                let fullpartial = ""
                let expirationDate = ""
                let lotNumber = ""
                let priceLevel = ""
                let rate = ""
                let amount = ""
                let manufacturer = ""
                let category = ""
                let itemDescription = ""
                let mfgProcessing = ""
                let pharmaProcessing = ""
                let nonReturnableReasons = ""
                let lineUniqueKey = ""

                const currentScript = runtime.getCurrentScript();

                const rrId = currentScript.getParameter({
                    name: "custscript_return_request_id",
                });
                i = currentScript.getParameter({
                    name: "custscript_kd_line",
                });
                log.debug('Information', `rrId: ${rrId} || line: ${i}`);
                let rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: rrId
                })
               log.debug('LineCount', rrRec.getLineCount('item'))
                while (i < rrRec.getLineCount('item')) {
                    let objectToProcess = new Array
                    log.debug('LineNum Start', i)
                    item = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })
                    NDC = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_ndc',
                        line: i
                    })
                    quantity = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    })
                    fullpartial = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_fullpartial',
                        line: i
                    })
                    expirationDate = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_expiration',
                        line: i
                    })
                    var returnReqSubrec = rrRec.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: i
                    });
                    lotNumber = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        line: 0
                    });
                    priceLevel = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: i
                    })
                    amount = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    })
                    manufacturer = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_item_manufacturer',
                        line: i
                    })
                    category = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_controlnum',
                        line: i
                    })
                    itemDescription = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    })
                    rate = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    })
                    mfgProcessing = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_mfgprocessing',
                        line: i
                    })
                    pharmaProcessing = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kod_rqstprocesing',
                        line: i
                    })
                    nonReturnableReasons = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_non_returnable_reason',
                        line: i
                    })
                    lineUniqueKey = rrRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        line: i
                    })
                    objectToProcess.push({
                        'master_return_id': rrRec.getValue('custbody_kd_master_return_id'),
                        'kd_ips_return_request': rrRec.id,
                        'kod_item_processed': +item,
                        'kd_ips_ndc': NDC,
                        'kd_return_item_proc_quantity': +quantity,
                        'kd_ret_item_proc_pack_list': fullpartial,
                        'kd_lot_expiration': expirationDate,
                        'kd_lotnumber': lotNumber,
                        'kd_ret_item_pricelevel': +priceLevel,
                        'kd_rate': +rate,
                        'kd_amount_charge': +amount,
                        'kd_rir_manufacturer': +manufacturer,
                        'kd_category': +category,
                        'kd_ips_item_description': description,
                        'kd_ips_scan_status': +mfgProcessing,
                        'kd_ips_returnable': +pharmaProcessing,
                        'kd_rip_line_unique_id': lineUniqueKey
                    })
                    log.debug('Object to Process: ', JSON.stringify(objectToProcess))
                    createItemProcessedRecord(objectToProcess)
                    i++
                }

            } catch (e) {
                log.error(e.message)
            }


        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce}

    });
