/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        var PHARMEXPSEARCH = 'customsearch_kd_pharma_expiration_search'
        var RRSEARCH = 'customsearch_rr_search_license_expired'

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        function UpdateRR(customerId,category) {
            log.debug('Starting to Update RR with Customer Id ' + customerId)
            try {
                // var retReqSearch = search.load({
                //     id: 'customsearch_rr_search_license_expired'
                // })
                // log.debug('RR Search ', retReqSearch)
                // retReqSearch.filters.push(search.createFilter({
                //     name: 'name',
                //     operator: 'anyof',
                //     values: customerId
                // }));
                //
                //
                // retReqSearch.run().each(function (result) {
                //     var id = result.id
                //     log.debug('Result Id ' + id)
                //     record.submitFields({
                //         type: 'customsale_kod_returnrequest',
                //         id: id,
                //         values: {
                //             'transtatus': 'D'
                //         }
                //     })
                // })
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type","anyof","CuTrSale102"],
                            "AND",
                            ["status","anyof","CuTrSale102:A"],
                            "AND",
                            ["mainline","is","T"],
                            "AND",
                            ["custbody_kd_rr_category","anyof",category],
                            "AND",
                            ["name","anyof",customerId]
                        ],
                    columns:[

            ]
            });
                var searchResultCount = transactionSearchObj.runPaged().count;
                log.debug("transactionSearchObj result count",searchResultCount);
                transactionSearchObj.run().each(function(result){
                        var id = result.id
                        log.debug('Result Id ' + id)
                        record.submitFields({
                            type: 'customsale_kod_returnrequest',
                            id: id,
                            values: {
                                'transtatus': 'C'
                            }
                        })
                    // .run().each has a limit of 4,000 results
                    return true;
                });

            } catch (e) {
                log.error(e.message)
            }

        }

        const execute = (context) => {
            try {


                var customerIds = [];
                log.debug("Scheduled Script is Running")
                var today = new Date();
                var dd = String(today.getDate()).padStart(2, '0');
                var mm = String(today.getMonth() + 1) //January is 0!
                var yyyy = today.getFullYear();

                dateToday = mm + '/' + dd + '/' + yyyy;
                log.debug('Date Today' + dateToday)
                var pharmaDateExpSearch = search.load({
                    id: PHARMEXPSEARCH
                }).run().each(function (result) {
                    var id = result.id;
                    var dateExp = result.getValue({
                        name: 'custentity_kd_license_exp_date'
                    })
                    var stateDateExp = result.getValue({
                        name: 'custentity_state_license_exp'
                    })
                    var isExpired = result.getValue({
                        name: 'custentity_kd_license_expired'
                    })
                    var stateLicenseisExpired = result.getValue({
                        name: 'custentity_kd_stae_license_expired'
                    })

                    // log.debug('Id ' + id + ' Expiration Date is ' + dateExp)
                    if (dateExp) {
                        if (dateExp <= dateToday && isExpired !== true) {
                            log.debug('Expiration Date ' + dateExp)
                            log.debug(id + ' License is expired ')
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: id,
                                values: {
                                    'custentity_kd_license_expired': true
                                }
                            })

                        } else {
                            log.debug(id + ' License is not expired ')
                            log.debug('Expiration Date ' + dateExp)
                            var category = ['3','4']

                            UpdateRR(id,category);
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: id,
                                values: {
                                    'custentity_kd_license_expired': false
                                }
                            })


                        }
                    }
                    if (stateDateExp) {
                        if (stateDateExp <= dateToday && stateLicenseisExpired !== true) {
                            log.debug('State Expiration Date ' + stateDateExp)
                            log.debug(id + ' License is expired ')
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: id,
                                values: {
                                    'custentity_kd_stae_license_expired': true
                                }
                            })

                        } else {
                            log.debug(id + ' License is not expired ')
                            log.debug('Expiration Date ' + stateDateExp)
                            var category = ['1']
                            UpdateRR(id,category);
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: id,
                                values: {
                                    'custentity_kd_stae_license_expired': false
                                }
                            })


                        }
                    }


                    return true;
                })
                // log.debug('Customer Ids ' + customerIds)
                // log.debug('Customer ids length ' + customerIds.length)
                // for (var i = 0; i < customerIds.length; i++) {
                //     log.debug('Update RR of customer ' + customerIds[i])
                //     UpdateRR(customerIds[i])
                // }
            } catch (e) {
                log.error(e.message)
            }
        }


        return {execute}

    });
