/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],

    function (search) {
        var FLD_IT_PHARMA_PROCESSING = 'custcol_kod_rqstprocesing';
        var FLD_IT_MFG_PROCESSING = 'custcol_kod_mfgprocessing';
        var PROCESSING_DESTRUCTION = 1;
        var PROCESSING_RETURN_FOR_CREDIT = 2;

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            alert('hello')
            log.debug('pageInit')
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */

        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var fieldName = context.fieldId;
            WHOLESALER = 'custcol_kd_wholesaler';
            MFG_RTN = 'custcol_kod_mfgrtn'

            var _wholesaler = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: WHOLESALER
            });
            var mfg_rtn = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: MFG_RTN
            })
            log.debug('WHOLESALER', _wholesaler)
            try {


            if (sublistName === 'item') {
                if ((fieldName == FLD_IT_PHARMA_PROCESSING || fieldName == FLD_IT_MFG_PROCESSING) && mfg_rtn) {
                    var pharmaProc = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_IT_PHARMA_PROCESSING
                    });

                    var mfgProc = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_IT_MFG_PROCESSING
                    });

                    log.debug('TEST', pharmaProc + ' : ' + mfgProc)

                    if (pharmaProc == PROCESSING_RETURN_FOR_CREDIT && mfgProc == PROCESSING_DESTRUCTION) {
                        alert("You cannot set the Manufacturing Processing for Destruction on a Return for Credit Pharmacy Processing.");

                        if (fieldName == FLD_IT_PHARMA_PROCESSING) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_IT_PHARMA_PROCESSING,
                                value: PROCESSING_DESTRUCTION
                            });

                        } else {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_IT_MFG_PROCESSING,
                                value: PROCESSING_RETURN_FOR_CREDIT
                            });

                        }
                        return false;
                    }
                } else if (fieldName == 'custcol_kod_mfgrtn') {
                    if (mfg_rtn) {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: FLD_IT_PHARMA_PROCESSING,
                            value: PROCESSING_RETURN_FOR_CREDIT
                        });

                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: FLD_IT_MFG_PROCESSING,
                            value: PROCESSING_RETURN_FOR_CREDIT
                        });
                    }
                }

                /*if (!_wholesaler) {
                    if (mfg_rtn === false) {
                        //alert('You cannot unset MFG RTN field if the item has a wholesaler');
                        alert('You cannot unset MFG RTN field if the item has NO wholesaler.')
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: MFG_RTN,
                            value: true
                        });
                        return false;
                    } else {
                        return true;
                    }

                }*/

            }
            } catch (e) {
                log.error(e.message)
            }

            return true;
        }

        function lineInit(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            MFG_PROCESSING = 'custcol_kod_mfgprocessing';
            PROCESSING = 'custcol_kod_rqstprocesing'
            MFG_RTN = 'custcol_kod_mfgrtn'
            /*var mfg_rtn = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: MFG_RTN
            })
            log.debug({title: 'mfg_rtn', details: mfg_rtn})
            if (sublistName === 'item') {
                if(mfg_rtn === false){
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: MFG_PROCESSING,
                        value: 2
                    });

                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: PROCESSING,
                        value: 2
                    });
                }
            }*/
            try {


                if (currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                }) == '') {

                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: MFG_PROCESSING,
                        value: ''
                    });



            }
            } catch (e) {
                log.error(e.message)
            }
        }


        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        return {
            fieldChanged: fieldChanged,
            lineInit: lineInit
        };

    });
