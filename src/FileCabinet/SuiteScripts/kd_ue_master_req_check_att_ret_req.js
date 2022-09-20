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
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.CREATE){
                return;
            }

            var rec = context.newRecord;
            log.debug({title: 'Record ', details: rec})

                var rrApprovedCount = 0;
                var readyForApproval = false;
                var masterId = rec.getValue('custbody_kd_master_return_id')
                log.debug({title: 'Master Id', details: masterId})
                if(masterId){
                    var transactionSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type","anyof","CuTrSale102"],
                                "AND",
                                ["custbody_kd_master_return_id","anyof",masterId],
                                "AND",
                                ["mainline","is","T"]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "statusref", label: "Status"})
                            ]
                    });
                    var searchResultCount = transactionSearchObj.runPaged().count;
                    log.debug("transactionSearchObj result count",searchResultCount);
                    transactionSearchObj.run().each(function(result){
                        var id = result.getValue({
                            name: 'internalid'
                        })
                        var status = result.getText({
                            name: 'statusref'
                        })
                        log.debug(id)
                        log.debug(status)
                        if(status == 'Approved'){
                            rrApprovedCount += 1;
                        }

                        return true;
                    });
                    log.debug({title: 'rrApprovedCount', details: rrApprovedCount})
                    if(rrApprovedCount === searchResultCount){
                        log.debug('Ready for approval ')
                        var otherId = record.submitFields({
                            type: 'customrecord_kod_masterreturn',
                            id: masterId,
                            values: {
                                'custrecord_kd_ready_for_approval': true
                            }
                        });
                    }
                    else{
                        var otherId = record.submitFields({
                            type: 'customrecord_kod_masterreturn',
                            id: masterId,
                            values: {
                                'custrecord_kd_ready_for_approval': false
                            }
                        });
                    }

                }

        }

        return {afterSubmit}

    });
