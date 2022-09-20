/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */

    (record, search) => {
        var RETURNREQUESTSEARCH = 'customsearch_rr_search';
        var RETURNITEMSEARCH = 'customsearch_return_item_processed_searc';
        var RETURN_ITEM_PROCESSED = 'customrecord_kod_mr_item_process'
        var RETURN_PACKAGE_SEARCH = 'customsearch_kd_package_return_search'
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
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        function updateReturnPackages(rrId) {
            log.debug('Updating Return Packages')
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
                            break;
                        case PACKAGERECEIPT:
                            package_receipt = result.id;
                            break;
                        case CREDITMEMO:
                            credit_memo = result.id;
                            break;
                        case SALESORDER:
                            sales_order.push(result.id);
                            break;
                        case INVOICE:
                            custinvoice = result.id;
                            break;
                        case ITEMRECEIPT:
                            item_receipt = result.id;
                            break;

                        default:
                        // code block
                    }


                    return true;
                });
                log.debug('Return Request Id', rrId)
                if (rrId) {

                    var packageSearchObj = search.load({
                        id: RETURN_PACKAGE_SEARCH
                    });
                    packageSearchObj.filters.push(search.createFilter({
                        name: "custrecord_kod_packrtn_rtnrequest",
                        operator: 'anyof',
                        values: rrId
                    }))
                    log.debug('Package OBJ', JSON.stringify(packageSearchObj))
                    packageSearchObj.run().each(function (result) {
                        log.debug('sales order', sales_order)
                        log.debug('invoice', custinvoice)
                        log.debug('credit memo', credit_memo)
                        log.debug('package receipt', package_receipt);
                        log.debug('return authorization', return_authorization)
                        log.debug('item receipt', item_receipt)
                        var returnPackageId = result.getValue({
                            name: 'internalid'
                        });
                        log.debug('Return Package Id ' + returnPackageId)
                        var returnPackage = record.load({
                            type: 'customrecord_kod_mr_packages',
                            id: returnPackageId
                        })
                        custinvoice ? returnPackage.setValue({
                            fieldId: 'custrecord_kod_packrtn_destrinv',
                            value: custinvoice
                        }) : false
                        credit_memo ? returnPackage.setValue({
                            fieldId: 'custrecord_kod_packrcpt_creditmemo',
                            value: credit_memo
                        }) : false

                        item_receipt ? returnPackage.setValue({
                            fieldId: 'custrecord_kod_packrtn_rmareceipt',
                            value: item_receipt
                        }) : false

                        return_authorization ? returnPackage.setValue({
                            fieldId: 'custrecord_kod_packrtn_rma',
                            value: return_authorization
                        }) : false

                        package_receipt ? returnPackage.setValue({
                            fieldId: 'custrecord_kod_packrtn_packrcpt',
                            value: package_receipt
                        }) : false

                        sales_order ? returnPackage.setValue({
                            fieldId: 'custrecord_kd_mfg_so',
                            value: sales_order
                        }) : false

                        var RPid = returnPackage.save({ignoreMandatoryFields: true})
                        log.debug({title: 'returnPackage', details: RPid})


                        return true;
                    });
                }
            }
        }

        function _getSublistValue(objRec, sublistId, fieldId, line) {
            return objRec.getSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                line: line
            });
        }

        function _setCurrentSublistValue(objRec, sublistId, fieldId, value, ignoreFieldChange) {
            return objRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
                value: value,
                ignoreFieldChange: false
            });
        }

        function createItemProcessed(curRec, line) {

            var linefinal = line - 1;
            var item, qty, amount, lotNumber, lotExpiration, creditMemo, invoice, rate, returnable, fullpartial, weight
            var rrId = curRec.getValue('custbody_kd_return_request')
            var mrId = curRec.getValue('custbody_kd_cm_master_return_id')
            item = _getSublistValue(curRec, 'item', 'item', line);
            qty = _getSublistValue(curRec, 'item', 'quantity', line);
            rate = _getSublistValue(curRec, 'item', 'rate', line);
            amount = _getSublistValue(curRec, 'item', 'amount', line);
            returnable = _getSublistValue(curRec, 'item', 'custcol_kod_nonreturnable', line);
            fullpartial = _getSublistValue(curRec, 'item', 'custcol_kod_fullpartial', line);
            weight = _getSublistValue(curRec, 'item', 'custcol_kd_weight', line)

            log.debug('CurrentRec', 'item: ' + item + '; qty: ' + qty + ';rate: ' + rate + '; amount:' + amount + '; returnable:' + returnable + '; weight:' + weight);

            var isNumbered;
            var curSubRec = curRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: linefinal
            });
            log.debug('curSubRec', curSubRec)
            isNumbered = _getSublistValue(curRec, 'item', 'isnumbered', line);
            var type = curRec.type;
            log.debug('Type', type)
            if (type == 'creditmemo') {
                creditMemo = curRec.id;
                log.debug('Credit Memo', creditMemo)
            } else {
                invoice = curRec.id
                log.debug('Invoice', invoice)
            }

            log.debug('cuRRec', 'line ' + line + ' isnumbered ' + isNumbered);
            if (isNumbered) {
                var curSubRec = curRec.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: line
                });
                // lotNumber = curRec.getSublistValue({
                //     sublistId: 'inventoryassignment',
                //     fieldId: 'receiptinventorynumber',
                //     line: 0
                // });
                // try {
                //     lotNumber = curSubRec.getSublistText({
                //         sublistId: 'inventoryassignment',
                //         fieldId: 'issueinventorynumber',
                //         line: 0
                //     });
                // } catch (e) {
                //     log.error(e.message)
                //     if(e){
                //         lotNumber = _getSublistValue(curSubRec, 'inventoryassignment', 'receiptinventorynumber', 0)
                //     }
                // }
                // log.debug('Lot number ' + lotNumber)
                if (type != 'creditmemo') {

                    lotNumber = curSubRec.getSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        line: 0
                    });
                    log.debug('Credit memo lot number' + lotNumber)
                } else {
                    lotNumber = _getSublistValue(curSubRec, 'inventoryassignment', 'receiptinventorynumber', 0)
                    log.debug('Invoice lot number' + lotNumber)
                }

                lotExpiration = _getSublistValue(curSubRec, 'inventoryassignment', 'expirationdate', 0);
                log.debug('lotNumber: ' + lotNumber + '; lotExpiration: ' + lotExpiration)
            }


            var itemProcessedRec = record.create({
                type: RETURN_ITEM_PROCESSED,
                isDynamic: true
            });
            log.debug('Return Processed Record ', itemProcessedRec)

                itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_line_id',
                    value: line + 1
                })
                itemProcessedRec.setValue({
                    fieldId: 'custrecord_master_return_id',
                    value: mrId
                })

                item ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kod_item_processed',
                    value: item
                }) : false
                qty ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_return_item_proc_quantity',
                    value: qty
                }) : false
                fullpartial ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_ret_item_proc_pack_list',
                    value: fullpartial
                }) : false
                lotNumber ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_lotnumber',
                    value: lotNumber
                }) : false
                lotExpiration ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_lot_expiration',
                    value: lotExpiration
                }) : false
                mrId ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_master_return_id',
                    value: mrId
                }) : false
                if (type == 'creditmemo') {
                    amount ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_amount_charge',
                        value: -Math.abs(amount)
                    }) : false


                    creditMemo ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_credit_memo',
                        value: creditMemo
                    }) : false
                } else {
                    amount ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_amount_charge',
                        value: amount
                    }) : false
                    invoice ? itemProcessedRec.setValue({
                        fieldId: 'custrecord_kd_invoice_link',
                        value: invoice
                    }) : false
                }

                rate ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_rate',
                    value: rate
                }) : false

                weight ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_weight',
                    value: weight
                }) : false

                returnable ? itemProcessedRec.setValue({
                    fieldId: 'custrecord_kd_pharma_proc',
                    value: returnable
                }) : false

            

            var itemProcId = itemProcessedRec.save({ignoreMandatoryFields: true})
            log.debug('Updated Proccess Id :' + itemProcId)

        }

        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (context) => {
            log.debug('Script is Running')
            rrSearch = search.load({
                id: RETURNREQUESTSEARCH
            });
            var mrrRec = context.newRecord;
            var mrrId = mrrRec.id
            rrSearch.filters.push(search.createFilter({
                name: 'custbody_kd_master_return_id',
                operator: 'anyof',
                values: mrrId
            }));
            var rrArray = new Array()
            rrSearch.run().each(function (result) {

                var rrId = result.id;
                //push to property filter

                rrArray.push(rrId);


                return true;
            });
            log.debug('RRId ' + rrArray)
            for (var i = 0; i < rrArray.length; i++) {
                updateReturnPackages(rrArray[i]);
                var creditMemoSearch = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CustCred"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["custbody_kd_return_request", "anyof", rrArray[i]]
                        ],
                    columns:
                        [
                            search.createColumn({name: "tranid", label: "Document Number"}),

                        ]
                });

                var invoiceSearch = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["custbody_kd_return_request", "anyof", rrArray[i]]
                        ],
                    columns:
                        [
                            search.createColumn({name: "tranid", label: "Document Number"}),

                        ]
                });
                var searchResultCount1 = invoiceSearch.runPaged().count;
                var searchResultCount = creditMemoSearch.runPaged().count;
                var cmId;
                var invId;
                log.debug('Invoice Id ', invId)
                if (searchResultCount1)
                    log.debug("transactionSearchObj result count", searchResultCount1);
                invoiceSearch.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    invId = result.id;
                    return true;
                });
                if (searchResultCount)
                    log.debug("transactionSearchObj result count", searchResultCount);
                creditMemoSearch.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    cmId = result.id;
                    return true;
                });
                log.debug('Invoice Id ' + invId)
                log.debug('cm id' + cmId)

                if(cmId){
                    var curRec = record.load({
                        type: record.Type.CREDIT_MEMO,
                        id: cmId
                    })
                    var lineCount = curRec.getLineCount('item')
                    log.debug('LineCount :' + lineCount)
                    for (var i = 0; i < lineCount; i++) {

                        var amount = curRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });
                        log.debug('Amount :' + amount)
                        if (amount > 0) {
                            createItemProcessed(curRec, i)
                        }

                    }
                }
                if(invId){
                    var invRec = record.load({
                        type: record.Type.INVOICE,
                        id: invId
                    })

                    var invLineCount = invRec.getLineCount('item')
                    log.debug('invLineCount :' + invLineCount)
                    for (var i = 0; i < invLineCount; i++) {

                        createItemProcessed(invRec, i)
                }

                log.debug('Inv rec', invRec)


                }


            }
        }


        return {onAction};
    });
