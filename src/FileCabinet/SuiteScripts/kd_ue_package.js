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
            var rec = context.newRecord;
            var deaLicense = rec.getValue('custrecord_kd_rp_dea_license')
            var stateLicense = rec.getValue('custrecord_kd_rp_state_license_expired')
            var rrId = rec.getValue('custrecord_kod_packrtn_rtnrequest')
            var trackingNumber = rec.getValue('custrecord_kod_packrtn_trackingnum')
            var passInbound = false
            var passOutbound = false
            var outBoundTrackingNumberCount = 0;
            var inBoundTrackingNumberCount = 0;
            var taskRec;
            var customrecord_kod_mr_packagesSearchObjOutBound = search.create({
                type: "customrecord_kod_mr_packages",
                filters:
                    [
                        ["custrecord_kd_is_222_kit","is","T"],
                        "AND",
                        ["custrecord_kod_packrtn_rtnrequest","anyof",rrId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            summary: "COUNT",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "custrecord_kod_packrtn_trackingnum",
                            summary: "COUNT",
                            label: "Tracking Number"
                        })
                    ]
            });
            var outBoundRPsearchResultCount =0;

            log.debug("customrecord_kod_mr_packagesSearchObj result count",outBoundRPsearchResultCount);
            customrecord_kod_mr_packagesSearchObjOutBound.run().each(function(result){
                // .run().each has a limit of 4,000 results
                outBoundTrackingNumberCount = result.getValue({
                    name: 'custrecord_kod_packrtn_trackingnum',
                    summary: 'COUNT'
                })
                outBoundRPsearchResultCount = result.getValue({
                    name: 'name',
                    summary: 'COUNT'
                })
                return true;
            });
            log.debug('outBoundTrackingNumberCount',outBoundTrackingNumberCount)
            log.debug('outBoundRPsearchResultCount',outBoundRPsearchResultCount)
            if( outBoundTrackingNumberCount == outBoundRPsearchResultCount) {
                passOutbound = true
          
            }
            log.debug('passOutbound', passOutbound)
            // inbound tracking number count

            var customrecord_kod_mr_packagesSearchObjInBound = search.create({
                type: "customrecord_kod_mr_packages",
                filters:
                    [
                        ["custrecord_kd_is_222_kit","is","F"],
                        "AND",
                        ["custrecord_kod_packrtn_rtnrequest","anyof",rrId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            summary: "COUNT",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "custrecord_kod_packrtn_trackingnum",
                            summary: "COUNT",
                            label: "Tracking Number"
                        })
                    ]
            });
            var inBoundRPsearchResultCount
            log.debug("customrecord_kod_mr_packagesSearchObj result count",inBoundRPsearchResultCount);
            customrecord_kod_mr_packagesSearchObjInBound.run().each(function(result){
                // .run().each has a limit of 4,000 results
                inBoundTrackingNumberCount = result.getValue({
                    name: 'custrecord_kod_packrtn_trackingnum',
                    summary: 'COUNT'
                })
                inBoundRPsearchResultCount = result.getValue({
                    name: 'name',
                    summary: 'COUNT'
                })
                return true;
            });


            log.debug('inBoundTrackingNumberCount',inBoundTrackingNumberCount)
            log.debug('inBoundRPsearchResultCount',inBoundRPsearchResultCount)
            if( inBoundTrackingNumberCount == inBoundRPsearchResultCount) {
                passInbound = true

            }
            log.debug('passInbound', passInbound)
            if ( trackingNumber) {
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: rrId,
                    isDynamic: true,
                });
                var status = rrRec.getValue('transtatus')
                var category = rrRec.getValue('custbody_kd_rr_category')
                log.debug('RR Info', 'status: ' + status + ' category: ' + category)
                if(category == 1 && stateLicense != true ){
                    if(status == 'A'){
                        if( passInbound == true) {
                            log.debug('setting status to pending package receipt for Rx category')
                            var retId = record.submitFields({
                                type: 'customsale_kod_returnrequest',
                                id: rrId,
                                values: {
                                    transtatus: 'D'
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }
                    log.debug('RetReq Id ', retId)
                }
                if(category == 4 &&  stateLicense != true && deaLicense != true ){
                    if(status == 'A'){
                        if( passInbound == true) {
                            log.debug('setting status to pending package receipt for C3-5 category')
                            var retId = record.submitFields({
                                type: 'customsale_kod_returnrequest',
                                id: rrId,
                                values: {
                                    transtatus: 'D'
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }
                    log.debug('RetReq Id ', retId)
                }
                if(outBoundRPsearchResultCount > 0 && category == 3 && status == 'J'){
                    log.audit('C2 Category')
                    var taskId;
                    var rrRec = record.load({
                        type: 'customsale_kod_returnrequest',
                        id: rrId,
                        isDynamic: true
                    })
                    var taskSearchObj = search.create({
                        type: "task",
                        filters:
                            [
                                ["custevent_kd_ret_req","anyof",rrId]
                            ],
                        columns:
                            [   search.createColumn({name: "internalid", label: "internalid"}),
                                search.createColumn({name: "custevent_kd_222_form_generated", label: "All 222 Form Generated?"}),
                                search.createColumn({name: "custevent_kd_ret_req", label: "Return Request Id"})
                            ]
                    });
                    var searchResultCount = taskSearchObj.runPaged().count;
                    log.debug("taskSearchObj result count",searchResultCount);
                    taskSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        taskId = result.getValue({name: 'internalid'})
                        return true;
                    });
                    taskRec = record.load({
                        type: 'task',
                        id: taskId,
                        isDynamic: true
                    })
                    var all222FormFileSearch = search.load({
                        id: 'customsearch_kd_222_form_file_search_2'
                    })
                    all222FormFileSearch.filters.push(search.createFilter({
                        name:'custrecord_kd_returnrequest',
                        operator: 'anyof',
                        values: rrId
                    }));
                    var searchResultCount = 0
                    var form222FileCount = 0;
                    all222FormFileSearch.run().each(function(result){
                        form222FileCount = result.getValue({
                            name: 'custrecord_kd_2frn_222_form_pdf',
                            summary: "COUNT"
                        })
                        searchResultCount = result.getValue({
                            name: 'id',
                            summary: "COUNT"
                        })
                        return true;
                    });
                    log.debug('Search Result Count ', searchResultCount )
                    log.debug('222 Form File Count', form222FileCount)
                    log.debug('Pass inBound and outbound Checking',passOutbound +' | ' +passInbound)
                    //Update tasks record;
                    if(searchResultCount > 0 && searchResultCount == form222FileCount && passOutbound == true && passInbound == true){

                        rrRec.setValue({fieldId:'transtatus',value: 'D'})
                        taskRec.setValue({fieldId: 'status',value: 'COMPLETE'})
                        taskRec.setValue({fieldId: 'custevent_kd_tracking_num',value: true})
                        taskRec.setValue({fieldId: 'custevent_kd_222_form_generated',value: true})
                        var rrRecId = rrRec.save({ignoreMandatoryFields:true})
                        var taskRecId = taskRec.save({ignoreMandatoryFields:true})
                        log.debug('Setting the Tracking Number true in task record.')
                        log.debug('Setting status of the task to COMPLETE and Return Request to Pending Package Receipt')

                    }
                    //check if the count of outbound and inbound tracking is the same with the internal ID count

                    if( passOutbound == true && passInbound == true) {


                        log.audit('Updating Task Record')
                        taskRec.setValue({fieldId: 'custevent_kd_tracking_num', value: true})
                        record.submitFields({
                            type: 'task',
                            id: taskRec.id,
                            values: {
                                'custevent_kd_tracking_num': true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        log.debug('setting the value of tracking number to true')
                    }
                }
                //  try {
                log.audit('RRStatus',  rrRec.getValue('transtatus'))

                log.audit('Return Request Status was moved to Pending package Receipt', rrRecId)

                // } catch (e) {
                //     log.error(e.message)
                // }

            }


        }


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
