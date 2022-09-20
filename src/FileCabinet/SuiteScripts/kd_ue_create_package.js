/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     */
    (record,search) => {
        const createReturnPackages = (rrId,mrrId,isC2) => {
            var rpIds = search.load('customsearch_kd_package_return_search_2').run().getRange({ start: 0, end: 1 });
            var rpName = 'RP' + (parseInt(rpIds[0].getValue({
                name: 'internalid',
                summary: search.Summary.MAX
            })) + parseInt(1));
            log.debug('Return Packages Name', rpName);

            var packageRec = record.create({
                type: 'customrecord_kod_mr_packages',
                isDynamic: true
            })

            packageRec.setValue({
                fieldId: 'name',
                value: rpName
            })
            log.debug('Is C2 ', isC2)
            if(isC2 == true){
                packageRec.setValue({
                    fieldId: 'custrecord_kd_is_222_kit',
                    value: true
                })
            }
            packageRec.setValue({
                fieldId: 'custrecord_kod_rtnpack_mr',
                value: mrrId
            })
            packageRec.setValue({
                fieldId: 'custrecord_kod_packrtn_rtnrequest',
                value: rrId
            })

            var id = packageRec.save({ignoreMandatoryFields: true})
            log.debug('Package Return Id' + id)


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

                var rrRec = context.newRecord;
                var rrId = rrRec.id;
                var mmrId = rrRec.getValue('custbody_kd_master_return_id')
                log.debug('RRid ', rrId)
                log.debug('mmrId ', mmrId)
                if (rrId) {
                    var category = rrRec.getValue({
                       fieldId: 'custbody_kd_rr_category'
                    })
                    log.debug('category ' + category)
                    var nummberofLabels;
                    switch (category) {
                        case 1:

                            //RXOTC Category
                            log.debug('Creating RX/OTC RP')
                          nummberofLabels = rrRec.getValue({
                              fieldId:'custbody_kd_rxotc_no_of_labels'
                          })
                            log.debug('nummberofLabels ' + nummberofLabels)
                            for (var i = 0; i <nummberofLabels; i++) {
                                createReturnPackages(rrId,mmrId)
                            }
                            break;
                        case 3:
                            log.debug('Creating C2 RP')
                            //C2 Category
                            nummberofLabels = rrRec.getValue({
                                fieldId: 'custbody_kd_c2_no_of_labels'
                            })
                            var isC2 = true
                            log.debug('nummberofLabels ' + nummberofLabels)
                            for (var i = 0; i <nummberofLabels; i++) {
                                createReturnPackages(rrId,mmrId, isC2)
                            }
                            break;
                        case '4':
                            log.debug('Creating C3-5 RP')
                            log.debug('nummberofLabels ' + nummberofLabels)
                            //C3-5 Category
                            nummberofLabels = rrRec.getValue({
                                fieldId:'custbody_kd_c3to5_no_of_labels'
                            })
                            for (var i = 0; i <nummberofLabels; i++) {
                                createReturnPackages(rrId,mmrId)
                            }

                            break;
                        default:
                        // code block
                    }
                }
            }


        return {afterSubmit}

    });
