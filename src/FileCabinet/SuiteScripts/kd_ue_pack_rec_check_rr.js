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
            var RETURN_PACKAGE_SEARCH = 'customsearch_kd_package_return_search'
            var returnPackageCount = 0;
            var packageReceiptCount = 0;
            var returnPackageIdArray = []
            var packageReceiptIdArray = []
            var rec = context.newRecord;
            log.debug({title: 'Record ', details: rec})
            var mrrId = rec.getValue('custbody_kd_master_return_id')
            let mrrRec = record.load({
                type: 'customrecord_kod_masterreturn',
                id: mrrId,
                isDynamic: true
            })

            let mrrStatus = mrrRec.getValue('custrecord_kod_mr_status')
            log.debug('Mrr status: ', mrrStatus)
            var received = false;
            var rrId = rec.getValue('custbody_kd_return_request')
            log.debug({title: 'RR Id', details: rrId})
            var rsLookup = search.lookupFields({
                type: 'customsale_kod_returnrequest',
                id: rrId,
                columns: ['status']
            })

            var rrStatus = rsLookup['status'][0].value
            log.debug('rrStatus', rrStatus)
            if (rrId != null && rrStatus === 'st.atusD') {
                try {
                    let rpSearch = search.load({
                        id: RETURN_PACKAGE_SEARCH
                    })
                    rpSearch.filters.push(search.createFilter({
                        name: 'custrecord_kod_packrtn_rtnrequest',
                        operator: 'anyof',
                        values: rrId
                    }));
                    returnPackageCount = rpSearch.runPaged().count;
                    var packageReceiptSearch = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type", "anyof", "CuTrSale103"],
                                "AND",
                                ["custbody_kd_return_request", "anyof", rrId],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({name: "custbody_kd_packageref", label: "Internal ID"}),
                                search.createColumn({name: "statusref", label: "Status"})
                            ]
                    });
                    packageReceiptCount = packageReceiptSearch.runPaged().count;
                    log.debug("RP and PR Count: ", `Return Package Count  ${returnPackageCount} || Package Receipt Count ${packageReceiptCount}`);
                    packageReceiptSearch.run().each(function (result) {
                        var id = result.getValue({
                            name: 'custbody_kd_packageref'
                        })
                        packageReceiptIdArray.push(id);
                        // rrStatus = result.getValue({
                        //     name: 'statusref'
                        // })

                        return true;
                    });
                    rpSearch.run().each(function (result) {
                        returnPackageIdArray.push(result.id)
                        // let rpId = record.submitFields({
                        //     type: 'customrecord_kod_mr_packages',
                        //     id: result.id,
                        //     values: {
                        //         'custrecord_kod_packrtn_packrcpt': rec.id
                        //     },
                        //     options: {
                        //         enableSourcing: false,
                        //         ignoreMandatoryFields: true
                        //     }
                        // });
                        log.debug({title: 'Return packages ID', details: result.id})

                        return true;
                    });
                    //check if internalid id of both array for return package and package receipt are equal
                    var isEqual = false
                    log.debug('returnPackageIdArray', returnPackageIdArray)
                    log.debug('packageReceiptIdArray', packageReceiptIdArray)
                    isEqual = returnPackageIdArray.length === packageReceiptIdArray.length &&
                        returnPackageIdArray.every(function (element) {
                            return packageReceiptIdArray.includes(element);
                        });
                    log.debug('Is EQUAL', isEqual)
                    if (returnPackageCount == packageReceiptCount && isEqual == true) {
                        //check if all of the return package Id is existing in every package receipt and  check if the package return and package receipt count is equal

                        var otherId = record.submitFields({
                            type: 'customsale_kod_returnrequest',
                            id: rrId,
                            values: {
                                'custbody_kd_package_received': true,
                                'transtatus': 'E'
                            }
                        });
                        log.debug('RR move to received Pending Processing', otherId)
                    } else {
                        var otherId = record.submitFields({
                            type: 'customsale_kod_returnrequest',
                            id: rrId,
                            values: {
                                'custbody_kd_package_received': false
                            }
                        });
                    }


                } catch (e) {
                    log.error(e.message)
                }


            }
            if (mrrStatus == 1) {
                log.debug('Mrr status is 1');
                let mrrIdRec = record.submitFields({
                    type: 'customrecord_kod_masterreturn',
                    id: mrrId,
                    values: {
                        'custrecord_kod_mr_status': 14
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug(`'Master Return ${mrrIdRec} Has been move to in Progress `)
            }


        }

        return {afterSubmit}

    });
