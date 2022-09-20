/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{search} email
     * @param{search} runtime
     */

    (record, search, email, runtime) => {
        var PHARMEXPSEARCH = 'customsearch_kd_pharma_expiration_search'
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
            log.debug({title: 'Get Input Data', details: ' Starting'})
            var customerIds = new Array();
            //  var customerWithExpiredLicense = [];
            try {

                var currentScript = runtime.getCurrentScript();

                var customer = currentScript.getParameter({
                    name: "custscript_kd_customer"
                });
                log.emergency('Customer Id ', customer)
                var pharmaDateExpSearch = search.load({
                    id: PHARMEXPSEARCH
                })
                if (customer) {
                    pharmaDateExpSearch.filters.push(search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: customer
                    }));
                }

                pharmaDateExpSearch.run().each(function (result) {
                    var id = result.id;
                    var dateExp = result.getValue({
                        name: 'custentity_kd_license_exp_date'
                    })
                    var isExpired = result.getValue({
                        name: 'custentity_kd_license_expired'
                    })
                    var stateDateExp = result.getValue({
                        name: 'custentity_state_license_exp'
                    })
                    log.emergency('state exp date : ' + stateDateExp)
                    var stateLicenseisExpired = result.getValue({
                        name: 'custentity_kd_stae_license_expired'
                    })

                    log.emergency(`Customer Id ${id}`, `State Lincese expired: ${stateLicenseisExpired} || DEA Lincesed expire: ${isExpired} `)


                    customerIds.push({
                        "id": id,
                        "expired": isExpired,
                        "isStateLicenseExpired": stateLicenseisExpired
                    })


                    return true;
                })

            } catch (e) {
                log.error(e.message)
            }

            log.audit('Customer Id ' + JSON.stringify(customerIds))

            return customerIds;


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

        const map = (mapContext) => {
            function createTask(customer, licenceType) {
                var taskRec = record.create({
                    type: record.Type.TASK,
                    isDynamic: true
                })
                taskRec.setValue({
                    fieldId: 'title',
                    value: licenceType + ' license is Expired for ' + customer
                })
                taskRec.setValue({
                    fieldId: 'message',
                    value: licenceType + ' license is Expired for ' + customer
                })
                taskRec.setValue({
                    fieldId: 'status',
                    value: 'PROGRESS'
                })
                var user = runtime.getCurrentUser().id;
                log.debug('User is ' + user)
                taskRec.setValue({
                    fieldId: 'assigned',
                    value: user
                })

                var taskId = taskRec.save()
                log.debug('task id ', taskId)
            }

            function UpdateRR(customerId, category) {
                var rrIds = []
                log.audit('Starting to Update RR with Customer Id ' + customerId, 'with category ' + category)
                try {
                    var transactionSearchObj = search.load({
                        id: 'customsearch_rr_pending_review'
                    })
                    transactionSearchObj.filters.push(search.createFilter({
                        name: 'name',
                        operator: 'anyof',
                        values: customerId
                    }));
                    transactionSearchObj.filters.push(search.createFilter({
                        name: 'custbody_kd_rr_category',
                        operator: 'anyof',
                        values: category
                    }));

                    var searchResultCount = transactionSearchObj.runPaged().count;
                    //    log.audit("transactionSearchObj result count", JSON.stringify(transactionSearchObj));
                    transactionSearchObj.run().each(function (result) {
                        var id = result.id
                        rrIds.push(id)
                        log.audit('Return Request Id:  ' + id, 'customer ID ' + customerId)


                        // .run().each has a limit of 4,000 results
                        return true;
                    });

                } catch (e) {
                    log.error(e.message)
                }
                log.audit('AA RRIDS ', rrIds)

                for (var i = 0; i < rrIds.length; i++) {
                    try {
                        var trackingNumber = ''
                        log.audit('AAA Updating RRId ', rrIds[i])
                        var rrRec = record.load({
                            type: 'customsale_kod_returnrequest',
                            id: rrIds[i],
                            isDynamic: true
                        })
                        var retCategory = rrRec.getValue('custbody_kd_rr_category')

                        log.audit('UpdateRR','category: '+retCategory )
                        if (retCategory == 4 || retCategory == 1) {
                            log.audit('Updating category 1 or 4')
                            var customrecord_kod_mr_packagesSearchObj = search.create({
                                type: "customrecord_kod_mr_packages",
                                filters:
                                    [
                                        ["custrecord_kod_packrtn_rtnrequest", "anyof", rrIds[i]]
                                    ],
                                columns:
                                    [
                                        search.createColumn({
                                            name: "custrecord_kod_packrtn_trackingnum",
                                            label: "Tracking Number"
                                        })
                                    ]
                            });
                            var searchResultCount = customrecord_kod_mr_packagesSearchObj.runPaged().count;
                            log.debug("customrecord_kod_mr_packagesSearchObj result count", searchResultCount);
                            customrecord_kod_mr_packagesSearchObj.run().each(function (result) {
                                // .run().each has a limit of 4,000 results
                                trackingNumber = result.getValue({
                                    name: 'custrecord_kod_packrtn_trackingnum'
                                })
                                return true;
                            });
                            log.audit('Tracking number', trackingNumber)
                            if (trackingNumber) {
                                log.audit('Setting ' + rrIds[i] + ' to Pending Package Receipt' )
                                rrRec.setValue({
                                    fieldId: 'transtatus',
                                    value: 'D'
                                })
                            }
                        } else {
                            log.audit('Updating C2 RR to C2 Kit to be mailed | RR ID:', rrRec.id)
                            rrRec.setValue({
                                fieldId: 'transtatus',
                                value: 'J'
                            })
                        }


                        var rrIdSave = rrRec.save({ignoreMandatoryFields: true})
                        //  log.audit('RR ' + rrIds[i] + 'has been move to authorized stage')
                        if (retCategory == 3) {
                            if (rrIdSave) {
                                var recipient = rrRec.getValue('entity')
                                var strSubject = ' Your Order #' + rrRec.getValue('tranid') + ' 222 Kit is on the way'
                                var strBody = ' Your Order #' + rrRec.getValue('tranid') + ' 222 Kit is on the way'
                                var userObj = runtime.getCurrentUser()
                                email.send({
                                    author: userObj.id,
                                    recipients: recipient,
                                    subject: strSubject,
                                    body: strBody
                                });
                            }
                        }
                    } catch (e) {
                        log.error(e.message, rrIds[i])
                    }
                }
            }


            var customerIds = [];
            var searchResult = JSON.parse(mapContext.value)
            //log.audit('search result ' + JSON.stringify(mapContext.value))

            var id = searchResult.id;
            // log.audit('Customer id is ' + id)
            var custRec = record.load({
                type: record.Type.CUSTOMER,
                id: parseInt(id),
                isDynamic: true
            })

            var isExpired = custRec.getValue('custentity_kd_license_expired')
            var stateLicenseExpired = custRec.getValue('custentity_kd_stae_license_expired')
            log.audit('Dea Licensed expired?', isExpired + "customer" + custRec.id)
            log.audit('State Licensed expired?', stateLicenseExpired + "customer" + custRec.id)

            if (stateLicenseExpired != true) {
                var category = [1]
                UpdateRR(id, category)
                log.audit('Updating Rx for customer ', id + 'with Catergory ' + category)
            }
            if (isExpired != true && stateLicenseExpired != true) {
                var category = [4, 3]
                log.audit('Updating C3 - 5 for customer ', id + 'with Catergory ' + category)

                UpdateRR(id, category)
            }


            var stateExpiDate = custRec.getValue('custentity_state_license_exp')
            var expiDate = custRec.getValue('custentity_kd_license_exp_date')
            // log.debug('Customer Record ', JSON.stringify(custRec))
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1) //January is 0!
            var yyyy = today.getFullYear();

            dateToday = mm + '/' + dd + '/' + yyyy;
            log.debug('Date Today' + dateToday)
            if (expiDate) {
                var xdd = String(expiDate.getDate()).padStart(2, '0');
                var xmm = String(expiDate.getMonth() + 1) //January is 0!
                var xyyyy = expiDate.getFullYear();
                expirationDate = xmm + '/' + xdd + '/' + xyyyy;
                log.debug('expiration date ' + expirationDate)


                if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
                    log.debug('DEA license is expired')
                    custRec.setValue({
                        fieldId: 'custentity_kd_license_expired',
                        value: true
                    })

                    if (id) {
                        var licenseType = 'DEA'
                        createTask(id, licenseType);

                    }

                } else {
                    log.debug('DEA license is not expired')
                    custRec.setValue({
                        fieldId: 'custentity_kd_license_expired',
                        value: false
                    })
                }
            }
            if (stateExpiDate) {
                var xdd = String(stateExpiDate.getDate()).padStart(2, '0');
                var xmm = String(stateExpiDate.getMonth() + 1) //January is 0!
                var xyyyy = stateExpiDate.getFullYear();
                expirationDate = xmm + '/' + xdd + '/' + xyyyy;
                log.debug('expiration date ' + expirationDate)


                if (Date.parse(expirationDate) <= Date.parse(dateToday)) {
                    log.debug('State license is expired')
                    custRec.setValue({
                        fieldId: 'custentity_kd_stae_license_expired',
                        value: true
                    })

                    if (id) {
                        var licenseType = 'STATE'
                        createTask(id, licenseType);

                    }

                } else {
                    log.debug('State license is not expired')
                    custRec.setValue({
                        fieldId: 'custentity_kd_stae_license_expired',
                        value: false
                    })
                }
            }
            var custRecId = custRec.save()
            log.audit('Cust Id ', custRecId)


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


        return {
            getInputData, map,
            // reduce,
            summarize
        }

    });
