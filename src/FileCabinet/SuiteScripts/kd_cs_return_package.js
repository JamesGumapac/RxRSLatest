/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     */
    function (record,search) {
        var RELATED_RECORDS_SEARCH = 'customsearch_kd_retreq_related_records'
        var PACKAGERECEIPT = 'CuTrSale';
        var RETURNAUTHORIZATION = 'RtnAuth'
        var CREDITMEMO = 'CustCred';
        var SALESORDER = 'SalesOrd';
        var INVOICE = 'CustInvc';
        var ITEMRECEIPT = 'ItemRcpt'
        var package_receipt;
        var return_authorization;
        var credit_memo;
        var sales_order = [];
        var custinvoice;
        var item_receipt;

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(context) {
            var rec = context.currentRecord;
            var rrId = rec.getValue('custrecord_kod_packrtn_rtnrequest')
            var packagereceipt = rec.getValue('custrecord_kod_packrtn_packrcpt')
            var creditmemo = rec.getValue('custrecord_kod_packrcpt_creditmemo')
            var returnauthorization = rec.getValue('custrecord_kod_packrtn_rma')
            var itemreceipt = rec.getValue('custrecord_kod_packrtn_rmareceipt')
            var invoice = rec.getValue('custrecord_kod_packrtn_destrinv')
            if (rrId) {
                var relatedRecordSearch = search.load({
                    id: RELATED_RECORDS_SEARCH
                });
                relatedRecordSearch.filters.push(search.createFilter({
                    name: "custbody_kd_return_request",
                    operator: 'anyof',
                    values: rrId
                }))
                var searchResultCount = relatedRecordSearch.runPaged().count;
                if (searchResultCount > 0) {
                    relatedRecordSearch.run().each(function (result) {

                        var tranid = result.id;
                        var type = result.getValue({name: 'type'})
                        log.debug('Trand id ', tranid)
                        log.debug('Type ', type)
                        switch (type) {
                            case RETURNAUTHORIZATION:
                                return_authorization = result.id;
                                if (return_authorization) {
                                    if (returnauthorization == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_rma',
                                            value: return_authorization
                                        })
                                    }
                                }
                                break;
                            case PACKAGERECEIPT:
                                package_receipt = result.id;
                                if (package_receipt) {
                                    if (packagereceipt == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_packrcpt',
                                            value: package_receipt
                                        })
                                    }
                                }
                                break;
                            case CREDITMEMO:
                                credit_memo = result.id;
                                if (credit_memo) {
                                    if (creditmemo == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrcpt_creditmemo',
                                            value: credit_memo
                                        })
                                    }
                                }
                                break;
                            case SALESORDER:
                                sales_order.push(result.id);
                                break;
                            case INVOICE:
                                custinvoice = result.id;
                                break;
                            case ITEMRECEIPT:
                                item_receipt = result.id;
                                if (item_receipt) {
                                    if (itemreceipt == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_rmareceipt',
                                            value: item_receipt
                                        })
                                    }
                                }
                                break;

                            default:
                            // code block
                        }


                        return true;
                    });


                }
            }

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
        function fieldChanged(scriptContext) {

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

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
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(context) {
            var rec = context.currentRecord;
            var rrId = rec.getValue('custrecord_kod_packrtn_rtnrequest')
            var packagereceipt = rec.getValue('custrecord_kod_packrtn_packrcpt')
            var creditmemo = rec.getValue('custrecord_kod_packrcpt_creditmemo')
            var returnauthorization = rec.getValue('custrecord_kod_packrtn_rma')
            var itemreceipt = rec.getValue('custrecord_kod_packrtn_rmareceipt')
            var invoice = rec.getValue('custrecord_kod_packrtn_destrinv')
            if (rrId) {
                var relatedRecordSearch = search.load({
                    id: RELATED_RECORDS_SEARCH
                });
                relatedRecordSearch.filters.push(search.createFilter({
                    name: "custbody_kd_return_request",
                    operator: 'anyof',
                    values: rrId
                }))
                var searchResultCount = relatedRecordSearch.runPaged().count;
                if (searchResultCount > 0) {
                    relatedRecordSearch.run().each(function (result) {

                        var tranid = result.id;
                        var type = result.getValue({name: 'type'})
                        log.debug('Trand id ', tranid)
                        log.debug('Type ', type)
                        switch (type) {
                            case RETURNAUTHORIZATION:
                                return_authorization = result.id;
                                if (return_authorization) {
                                    if (returnauthorization == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_rma',
                                            value: return_authorization
                                        })
                                    }
                                }
                                break;
                            case PACKAGERECEIPT:
                                package_receipt = result.id;
                                if (package_receipt) {
                                    if (packagereceipt == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_packrcpt',
                                            value: package_receipt
                                        })
                                    }
                                }
                                break;
                            case CREDITMEMO:
                                credit_memo = result.id;
                                if (credit_memo) {
                                    if (creditmemo == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrcpt_creditmemo',
                                            value: credit_memo
                                        })
                                    }
                                }
                                break;
                            case SALESORDER:
                                sales_order.push(result.id);
                                break;
                            case INVOICE:
                                custinvoice = result.id;
                                break;
                            case ITEMRECEIPT:
                                item_receipt = result.id;
                                if (item_receipt) {
                                    if (itemreceipt == '') {
                                        rec.setValue({
                                            fieldId: 'custrecord_kod_packrtn_rmareceipt',
                                            value: item_receipt
                                        })
                                    }
                                }
                                break;

                            default:
                            // code block
                        }


                        return true;
                    });


                }
            }

            return true;
        }

        return {
            pageInit : pageInit,
            saveRecord: saveRecord
        };

    });
