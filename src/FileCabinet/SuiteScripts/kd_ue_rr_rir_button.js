/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/redirect', 'N/ui/serverWidget', 'N/url', 'N/search', 'N/record', 'N/runtime'],
    /**
     * @param{redirect} redirect
     * @param{serverWidget} serverWidget
     * @param{url} url
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    (redirect, serverWidget, url, search, record, runtime) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const createItemProcessedRecord = (objectToProcess) => {
            log.debug('Object to Process length: ', objectToProcess.length)
            var script = runtime.getCurrentScript();
            log.audit({
                "title": "Governance Monitoring Function Create Item Processed",
                "details": "Remaining Usage = " + script.getRemainingUsage()
            });
            let itemProcessedRec = record.create({
                type: 'customrecord_kod_mr_item_process',
                isDynamic: true
            })

            if (objectToProcess.length > 0) {
                var keys = Object.keys(objectToProcess[0])
                var values = Object.values(objectToProcess[0])

                try {
                    for (let i in keys) {
                        //if the value is "" skip the line field
                        if(values[i] == "" ){ continue }
                        itemProcessedRec.setValue({
                            fieldId: 'custrecord_' + keys[i],
                            value: values[i]
                        })

                        log.debug('custrecord_' + keys[i], itemProcessedRec.getValue('custrecord_' + keys[i]))

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
        const beforeLoad = (context) => {

            var rec = context.newRecord;
            var status = rec.getValue('transtatus')
            if (context.type == 'view' && status != 'I' && status != 'K' ) {
                log.debug('executing script')
                var RIRSEARCH = 'customsearch606'
                var rec = context.newRecord
                var rrId = rec.id
                var category = rec.getValue('custbody_kd_rr_category')
                log.debug('RRID ' + rrId)
                var mmrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: rrId
                })

                var masterReturnId = mmrRec.getValue('custbody_kd_master_return_id')


                log.debug('Master Return Id', masterReturnId)

                context.form.clientScriptFileId = 18581;
                if (category == 3) {

                    context.form.addButton({
                        id: 'custpage_create_rir',
                        label: 'Add Items Requested ',
                        functionName: 'createMultipleRir(' + rrId + ',' + masterReturnId + ')'
                    })
                }


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
        const beforeSubmit = (context) => {

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

            var script = runtime.getCurrentScript();

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
            let remainingUsage = runtime.getCurrentScript().getRemainingUsage();


            let rrRec = context.newRecord;
            let status = rrRec.getValue('transtatus');
            log.debug('Status: ', status);
            if (status !== 'I')
                return;
            let lineNum = 0;
            //use user event if remainingUsage is can handle the creation of the item processed
            for (let i = 0; i < rrRec.getLineCount('item'); i++) {
                log.audit({
                    "title": "Governance Monitoring",
                    "details": "Remaining Usage = " + script.getRemainingUsage()
                });
                lineNum = i

                if (remainingUsage > 10) {
                    let objectToProcess = new Array
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
                    log.debug('Ramaining USage: ', remainingUsage)

                }
            }

            if(remainingUsage < 6){
                log.debug('Continue to processed using Map Reduce', `MR will start at line ${lineNum}`)
                try {
                    var myTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_kd_mr_create_item_processed',
                        deploymentId: 'customdeploy_kd_mr_create_item_processed',
                        params:  {
                            'custscript_return_request_id': rrRec.id,
                            'custscript_kd_line' : lineNum,
                        }
                    })
                    var objTaskId = myTask.submit();
                } catch (e) {
                    log.error(e.message)
                }

            }

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
