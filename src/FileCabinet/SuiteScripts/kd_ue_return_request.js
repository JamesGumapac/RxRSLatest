/**
 *@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/url', 'N/redirect', 'N/ui/serverWidget', 'N/search', 'N/runtime', 'N/task'],
function (record, url, redirect, serverWidget, search, runtime, task) {
    var SEA_RETURN_ITEM_RQSTD = 'customsearch_kd_return_item_requested';
    var SEA_RET_REQ_ITEMS = 'customsearch_kd_rr_items';
    var SCR_ID_GENERATE_FORM_222 = 626;
    var REC_RETURN_REQUEST = 'customsale_kod_returnrequest';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var RETURN_PACKAGE_SEARCH = 'customsearch_kd_package_return_search'
    var SCR_FILE_NAME_CS_RR = 'kd_cs_form_ret_req.js';
    var DPLYMNT_GENERATE_FORM_222 = 'customdeploy_kd_sl_generate_form222';
    var FLD_RET_REQ_IT_PROCESSING = 'custcol_kod_rqstprocesing';
    var FLD_RET_REQ_IT_MFG_PROCESSING = 'custcol_kod_mfgprocessing';
    var FLD_RET_REQ_IT_ALLOW_BATCH = 'custcol_kd_mfg_allow_batch';
    var FLD_RMA_RET_REQ = 'custbody_kd_return_request';
    var FLD_RETREQ_ITEM_MANUFACTURER = 'custcol_kd_item_manufacturer';
    var FLD_RETREQ_ITEM_WHOLESALER = 'custcol_kd_wholesaler';
    var FLD_RETREQ_ITEM_MANUF_CUSTOMER = 'custcol_manuf_customer';
    var FLD_RETREQ_ITEM_MFG_ALLOW_BATCH = 'custcol_kd_mfg_allow_batch';
    var FLD_RETREQ_MFG_RETURN = 'custcol_kod_mfgrtn';
    var FLD_RETREQ_CATEGORY = 'custbody_kd_rr_category';
    var FLD_RETREQ_MRR = 'custbody_kd_master_return_id';
    var FLD_RETREQ_FOR_222_FORM_ASSIGNMENT = 'custbody_kd_for_222_form_assignment';
    var FLD_RIR_FORM_222_REF_NUM = 'custrecord_kd_rir_form222_ref';
    var FLD_RIR_RR = 'custrecord_kd_rir_return_request';
    var FLD_RIR_CATEGORY = 'custrecord_kd_rir_category';
    var PROCESSING_NONRETURNABLE = 1;
    var PROCESSING_RETURNABLE = 2;
    var CATEGORY_C2 = 3;
    var soItemsByManuf = {};
    var soItemsByWhslr = {};
    var PRCLVL_NONRETURNABLE = 7;
    //var hasDestruction = false;
    //var hasReturn = false;

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

    function createRma(returnRequestRec) {
        var rmaRec = record.create({
            type: record.Type.RETURN_AUTHORIZATION,
            isDynamic: true
        });

        rmaRec.setValue('entity', returnRequestRec.getValue('entity'));
        rmaRec.setValue('orderstatus', 'B');
        rmaRec.setValue(FLD_RMA_RET_REQ, returnRequestRec.id);
        rmaRec.setValue('location', returnRequestRec.getValue('location'))

        var item, qty, rate, amount, processing;
        for (var i = 0; i < returnRequestRec.getLineCount('item'); i++) {
            item = _getSublistValue(returnRequestRec, 'item', 'item', i);
            qty = _getSublistValue(returnRequestRec, 'item', 'quantity', i);
            rate = _getSublistValue(returnRequestRec, 'item', 'rate', i);
            amount = _getSublistValue(returnRequestRec, 'item', 'amount', i);
            fullpartial = _getSublistValue(returnRequestRec, 'item', 'custcol_kod_fullpartial', i);

            log.debug('createRma', 'item: ' + item + '; qty: ' + qty + ';rate: ' + rate + '; amount:' + amount + '; fullpartial:' + fullpartial);

            rmaRec.selectNewLine({
                sublistId: 'item'
            });

            _setCurrentSublistValue(rmaRec, 'item', 'item', item, true);
            _setCurrentSublistValue(rmaRec, 'item', 'quantity', qty, true);
            _setCurrentSublistValue(rmaRec, 'item', 'custcol_kod_fullpartial', fullpartial, true);
            processing = _getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_PROCESSING, i);
            if (processing == PROCESSING_NONRETURNABLE) {
                _setCurrentSublistValue(rmaRec, 'item', 'price', '-1', true);
                _setCurrentSublistValue(rmaRec, 'item', 'rate', rate, true);
                _setCurrentSublistValue(rmaRec, 'item', 'amount', 0, true);
                //if (!hasDestruction) hasDestruction = true;
            } else {
                _setCurrentSublistValue(rmaRec, 'item', 'amount', amount, true);
                //if (!hasReturn) hasReturn = true;
            }
            rmaRec.commitLine('item');
        }

        var rmaId = rmaRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('createRma', 'RMA ID: ' + rmaId)
        updateRmaInvDetail(rmaId, returnRequestRec);


        var packageSearchObj = search.load({
            id: RETURN_PACKAGE_SEARCH
        });
        packageSearchObj.filters.push(search.createFilter({
            name: "custrecord_kod_packrtn_rtnrequest",
            operator: 'anyof',
            values: returnRequestRec.id
        }))
        packageSearchObj.run().each(function (result) {

            var returnPackage = record.submitFields({
                type: 'customrecord_kod_mr_packages',
                id: result.id,
                values: {
                    'custrecord_kod_packrtn_rma': rmaId
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            log.debug('Update Return Package RMA ', returnPackage)
            return true;
        });

        return rmaId;
    }

    function updateRmaInvDetail(rmaId, returnRequestRec) {
        var rmaRec = record.load({
            type: record.Type.RETURN_AUTHORIZATION,
            id: rmaId,
            isDynamic: true,
        });

        var isNumbered;
        for (var i = 0; i < rmaRec.getLineCount('item'); i++) {
            rmaRec.selectLine({
                sublistId: 'item',
                line: i
            });

            rmaRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: true
            });

            var returnReqSubrec = returnRequestRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: i
            });
            isNumbered = rmaRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'isnumbered'
            });
            log.debug('updateRmaInvDetail', 'line ' + i + ' isnumbered ' + isNumbered);
            if (isNumbered == 'T') {
                log.debug('updateRmaInvDetail', 'subrecord line count: ' + returnReqSubrec.getLineCount('inventoryassignment'));
                var subrecordCount = returnReqSubrec.getLineCount('inventoryassignment');
                var subRec = rmaRec.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });
                for (var subrecIndx = 0; subrecIndx < subrecordCount; subrecIndx++) {
                    log.debug('updateRmaInvDetail', 'subrecord invnum: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        line: subrecIndx
                    }));
                    log.debug('updateRmaInvDetail', 'subrecord quantity: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: subrecIndx
                    }));
                    log.debug('updateRmaInvDetail', 'subrecord expirationdate: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: subrecIndx
                    }));

                    subRecNum = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        line: subrecIndx
                    });

                    subRecQty = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: subrecIndx
                    });

                    subRecExpDate = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: subrecIndx
                    });

                    subRec.selectNewLine({
                        sublistId: 'inventoryassignment',
                    });

                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: subRecQty
                    });

                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        value: subRecNum
                    });

                    subRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: subRecExpDate
                    });

                    subRec.commitLine({
                        sublistId: 'inventoryassignment'
                    });
                }

                rmaRec.commitLine({
                    sublistId: 'item'
                })
            }
        }

        var rmaId = rmaRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

        log.debug('updateRmaInvDetail', 'RMA ID: ' + rmaId)
    }

    function receiveRma(rmaId, returnRequestRec) {
        var irRec = record.transform({
            fromType: record.Type.RETURN_AUTHORIZATION,
            fromId: rmaId,
            toType: record.Type.ITEM_RECEIPT,
            isDynamic: true,
        });

        for (var i = 0; i < irRec.getLineCount('item'); i++) {
            irRec.selectLine({
                sublistId: 'item',
                line: i
            });

            irRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: true
            });

            irRec.commitLine({
                sublistId: 'item'
            })
        }

        irRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('receiveRma', 'Item Receipt ID: ' + irRec.id);
        //update package sub record
        var packageSearchObj = search.load({
            id: RETURN_PACKAGE_SEARCH
        });
        packageSearchObj.filters.push(search.createFilter({
            name: "custrecord_kod_packrtn_rtnrequest",
            operator: 'anyof',
            values: returnRequestRec.id
        }))
        packageSearchObj.run().each(function (result) {

            var returnPackage = record.submitFields({
                type: 'customrecord_kod_mr_packages',
                id: result.id,
                values: {
                    'custrecord_kod_packrtn_rmareceipt': irRec.id
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            log.debug('Update Package Return IRec ', result.id)
            return true;
        });
    }

    function createCreditMemo(rmaId, returnRequestRec) {
        var cmRec = record.transform({
            fromType: record.Type.RETURN_AUTHORIZATION,
            fromId: rmaId,
            toType: record.Type.CREDIT_MEMO,
            isDynamic: true,
        });

        for (var i = 0; i < returnRequestRec.getLineCount('item'); i++) {
            if (_getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_PROCESSING, i) == PROCESSING_NONRETURNABLE) {
                cmRec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                cmRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: 0,
                    ignoreFieldChange: false
                });
                log.debug('createCreditMemo', 'Set line ' + i + ' amount to 0')
            }
        }

        cmRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('createCreditMemo', 'Credit Memo ID: ' + cmRec.id);
    }

    function createPharmacyInvoice(returnRequestRec) {
        log.debug('Creating Pharmacy Invoice')
        var invcRec = record.create({
            type: record.Type.INVOICE,
            isDynamic: true
        });
        var TOTAL_NON_RETURNABLE_FEE_WEIGHT = returnRequestRec.getValue('custbody_kd_total_non_returnable_fee_w')
        var TOTAL_NON_RETURNABLE_FEE_QTY = returnRequestRec.getValue('custbody_kd_total_non_returnable_qty')
        var TOTAL_RETURNABLE_FEE_QTY = returnRequestRec.getValue('custbody_kd_total_returnable_fee_qty')
        var TOTAL_NON_SCANNABLE_FEE_QTY = returnRequestRec.getValue('custbody_kd_total_non_scannable_w')
        var TOTAL_222_FORM_FEE = returnRequestRec.getValue('custbody_kd_total_222_form_fee')
        var hasNonRetunable = false
        invcRec.setValue('entity', returnRequestRec.getValue('entity'));
        invcRec.setValue(FLD_RMA_RET_REQ, returnRequestRec.id);
        invcRec.setValue('location', returnRequestRec.getValue('location'));
        invcRec.setValue('approvalstatus', '1');
        log.debug('createPharmacyInvoice', 'invcRec Location: ' + invcRec.getValue('location'));

        var item, qty, rate, amount, processing, priceLevel;
        log.debug('createPharmacyInvoice', 'retreqlinecount: ' + returnRequestRec.getLineCount('item'));
        var hasItemLine = false;
        var hasItemForBatch = false;
        for (var i = 0; i < returnRequestRec.getLineCount('item'); i++) {
            if (_getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_PROCESSING, i) == PROCESSING_NONRETURNABLE && !_getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_ALLOW_BATCH, i)) {
                log.debug('test', 'item line ' + i + 'is returnable and manuf does not allow batch')
                item = _getSublistValue(returnRequestRec, 'item', 'item', i);
                qty = _getSublistValue(returnRequestRec, 'item', 'quantity', i);
                rate = _getSublistValue(returnRequestRec, 'item', 'rate', i);
                amount = _getSublistValue(returnRequestRec, 'item', 'amount', i);
                fullpartial = _getSublistValue(returnRequestRec, 'item', 'custcol_kod_fullpartial', i);
                log.debug('createPharmacyInvoice', 'item: ' + item + '; qty: ' + qty + ';rate: ' + rate + '; amount:' + amount + '; fullpartial:' + fullpartial);
                hasNonRetunable = true;
                invcRec.selectNewLine({
                    sublistId: 'item'
                });

                _setCurrentSublistValue(invcRec, 'item', 'item', item, true);
                _setCurrentSublistValue(invcRec, 'item', 'quantity', qty, true);
                _setCurrentSublistValue(invcRec, 'item', 'custcol_kod_fullpartial', fullpartial, true);
                _setCurrentSublistValue(invcRec, 'item', 'price', '-1', true);
                _setCurrentSublistValue(invcRec, 'item', 'rate', rate, true);
                _setCurrentSublistValue(invcRec, 'item', 'amount', amount, true);
                _setCurrentSublistValue(invcRec, 'item', 'location', invcRec.getValue('location'), true);

                log.debug('createPharmacyInvoice', 'item qty: ' + invcRec.getCurrentSublistValue('item', 'quantity'));
                var returnReqSubrec = returnRequestRec.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: i
                });
                log.debug('test', 'subrecord line count: ' + returnReqSubrec.getLineCount('inventoryassignment'));
                var subrecordCount = returnReqSubrec.getLineCount('inventoryassignment');
                var invSubRec = invcRec.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail'
                });
                for (var subrecIndx = 0; subrecIndx < subrecordCount; subrecIndx++) {
                    log.debug('createPharmacyInvoice', 'subrecord invnum: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'numberedrecordid',
                        line: subrecIndx
                    }));
                    log.debug('createPharmacyInvoice', 'subrecord quantity: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: subrecIndx
                    }));
                    log.debug('createPharmacyInvoice', 'subrecord expirationdate: ' + returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: subrecIndx
                    }));

                    subRecNum = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'numberedrecordid',
                        line: subrecIndx
                    });

                    subRecQty = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: subrecIndx
                    });

                    subRecExpDate = returnReqSubrec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: subrecIndx
                    });

                    invSubRec.selectNewLine({
                        sublistId: 'inventoryassignment',
                    });

                    invSubRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: subRecQty
                    });

                    invSubRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        value: subRecNum
                    });

                    invSubRec.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        value: subRecExpDate
                    });

                    invSubRec.commitLine({
                        sublistId: 'inventoryassignment'
                    });
                }

                invcRec.commitLine('item');
                if (!hasItemLine) hasItemLine = true;
            } else if (_getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_PROCESSING, i) == PROCESSING_NONRETURNABLE && _getSublistValue(returnRequestRec, 'item', FLD_RET_REQ_IT_ALLOW_BATCH, i)) {
                hasItemForBatch = true;
                log.debug('TEST', 'a line has manuf allow batching')
            }
        }

        if (hasNonRetunable == true) {
            if (TOTAL_NON_SCANNABLE_FEE_QTY > 0) {
                invcRec.setValue({
                    fieldId: 'custbody_kd_total_non_scannable_w',
                    value: TOTAL_NON_SCANNABLE_FEE_QTY
                });
                invcRec.selectNewLine({
                    sublistId: 'item'
                });
                _setCurrentSublistValue(invcRec, 'item', 'item', 649)
                _setCurrentSublistValue(invcRec, 'item', 'amount', 0)
                _setCurrentSublistValue(invcRec, 'item', 'custcol_kd_non_scannable_fee_weight', TOTAL_NON_SCANNABLE_FEE_QTY)
                invcRec.commitLine('item');
            }
            if (TOTAL_RETURNABLE_FEE_QTY > 0) {
                invcRec.setValue({
                    fieldId: 'custbody_kd_total_returnable_fee_qty',
                    value: TOTAL_RETURNABLE_FEE_QTY
                })
                invcRec.selectNewLine({
                    sublistId: 'item'
                });
                _setCurrentSublistValue(invcRec, 'item', 'item', 107)
                _setCurrentSublistValue(invcRec, 'item', 'amount', 0)
                _setCurrentSublistValue(invcRec, 'item', 'custcol_kd_returnable_fee', TOTAL_RETURNABLE_FEE_QTY)
                invcRec.commitLine('item');
            }
            if (TOTAL_222_FORM_FEE > 0) {
                invcRec.setValue({
                    fieldId: 'custbody_kd_total_222_form_fee',
                    value: TOTAL_222_FORM_FEE
                })
                invcRec.selectNewLine({
                    sublistId: 'item'
                });
                _setCurrentSublistValue(invcRec, 'item', 'item', 208)
                _setCurrentSublistValue(invcRec, 'item', 'amount', 0)
                _setCurrentSublistValue(invcRec, 'item', 'custcol_kd_222_form_fee', TOTAL_222_FORM_FEE)

                invcRec.commitLine('item');
            }
            if (TOTAL_NON_RETURNABLE_FEE_QTY > 0) {
                invcRec.setValue({
                    fieldId: 'custbody_kd_total_non_returnable_qty',
                    value: TOTAL_NON_RETURNABLE_FEE_QTY
                });
                invcRec.selectNewLine({
                    sublistId: 'item'
                });
                _setCurrentSublistValue(invcRec, 'item', 'item', 207)
                _setCurrentSublistValue(invcRec, 'item', 'amount', 0)
                _setCurrentSublistValue(invcRec, 'item', 'custcol_kd_non_returnable_fee_qty', TOTAL_NON_RETURNABLE_FEE_QTY)

                if (TOTAL_NON_RETURNABLE_FEE_WEIGHT > 0) {
                    invcRec.setValue({
                        fieldId: 'custbody_kd_total_non_returnable_fee_w',
                        value: TOTAL_NON_RETURNABLE_FEE_WEIGHT
                    })
                    _setCurrentSublistValue(invcRec, 'item', 'custcol_kd_non_returnable_fee_weight', TOTAL_NON_RETURNABLE_FEE_WEIGHT)
                }
                invcRec.commitLine('item');
            }
        }

        var invcId;
        log.debug('TEST', 'hasItemForBatch' + hasItemForBatch)
        if (hasItemForBatch) {
            record.submitFields({
                type: REC_RETURN_REQUEST,
                id: returnRequestRec.id,
                values: {
                    custbody_kd_for_so_batch: true
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            /*invcRec.setValue({
                fieldId: 'custbody_kd_for_so_batch',
                value: true
            });*/
            log.debug('TEST', 'tagged RR for so batch')
        }
        if (hasItemLine) {
            var invcId = invcRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }
        log.debug('createPharmacyInvoice', 'INVOICE ID: ' + invcId)
        return invcId;
    }

    function getItemsByManufAndWhslr(returnRequestRec) {
        var rrItems = [], item, quantity, priceLevel, rate, amount, manuf, manufCustomer, bag, whslr, invDetail = [],
            itemDetails = {};
        for (var i = 0; i < returnRequestRec.getLineCount('item'); i++) {
            //12/15/21 if(returnRequestRec.getSublistValue('item', FLD_RET_REQ_IT_PROCESSING, i) == PROCESSING_RETURNABLE){
            if (returnRequestRec.getSublistValue('item', FLD_RET_REQ_IT_MFG_PROCESSING, i) == PROCESSING_RETURNABLE && !returnRequestRec.getSublistValue('item', FLD_RETREQ_ITEM_MFG_ALLOW_BATCH, i)) {
                invDetail = [];
                item = returnRequestRec.getSublistValue('item', 'item', i);
                quantity = returnRequestRec.getSublistValue('item', 'quantity', i);
                priceLevel = returnRequestRec.getSublistValue('item', 'price', i);
                rate = returnRequestRec.getSublistValue('item', 'rate', i);
                amount = returnRequestRec.getSublistValue('item', 'amount', i);
                bag = returnRequestRec.getSublistValue('item','custcol_kd_baglabel_link',i)

                retReqSubRec = returnRequestRec.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: i
                });

                var subRecNum, subRecQty, subRecExpDate;
                for (var subrecIndx = 0; subrecIndx < retReqSubRec.getLineCount('inventoryassignment'); subrecIndx++) {
                    subRecNum = retReqSubRec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'numberedrecordid',//'receiptinventorynumber',
                        line: subrecIndx
                    });

                    subRecQty = retReqSubRec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: subrecIndx
                    });

                    subRecExpDate = retReqSubRec.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'expirationdate',
                        line: subrecIndx
                    });

                    invDetail.push({invnum: subRecNum, quantity: subRecQty, expdate: subRecExpDate});
                }

                itemDetails = {
                    item: item,
                    quantity: quantity,
                    pricelevel: priceLevel,
                    rate: rate,
                    amount: amount,
                    inventorydetail: invDetail,
                    bag: bag
                };
                log.debug('getItemsByManufAndWhslr', 'is manufItems: ' + returnRequestRec.getSublistValue('item', FLD_RETREQ_MFG_RETURN, i));
                log.debug('getItemsByManufAndWhslr', 'manuf customer: ' + returnRequestRec.getSublistValue('item', FLD_RETREQ_ITEM_MANUF_CUSTOMER, i));
                whslr = returnRequestRec.getSublistValue('item', FLD_RETREQ_ITEM_WHOLESALER, i);
                if (whslr != null && whslr != '') {
                    if (!soItemsByWhslr.hasOwnProperty(whslr)) {
                        soItemsByWhslr[whslr] = [];
                    }
                    soItemsByWhslr[whslr].push(itemDetails);
                } else {
                    manuf = returnRequestRec.getSublistValue('item', FLD_RETREQ_ITEM_MANUFACTURER, i);
                    manufCustomer = returnRequestRec.getSublistValue('item', FLD_RETREQ_ITEM_MANUF_CUSTOMER, i);
                    if (!soItemsByManuf.hasOwnProperty(manufCustomer)) {
                        soItemsByManuf[manufCustomer] = [];
                    }
                    soItemsByManuf[manufCustomer].push(itemDetails);
                }
            }
        }
        log.debug('getItemsByManufAndWhslr', 'manufItems: ' + JSON.stringify(soItemsByManuf));
        log.debug('getItemsByManufAndWhslr', 'whslrItems: ' + JSON.stringify(soItemsByWhslr));
    }

    function createSalesOrder(manuf, soItems, returnRequestRec) {
        var soRec = record.create({
            type: record.Type.SALES_ORDER,
            isDynamic: true
        });
        var bagArray = []
        soRec.setValue('entity', manuf);
        soRec.setValue('orderstatus', 'B');
        soRec.setValue(FLD_RMA_RET_REQ, returnRequestRec.id);
        soRec.setValue('location', returnRequestRec.getValue('location'));

        var item, qty, priceLevel, rate, amount, invDtl, invDtlNum, invDtlQty, invDtlExpData,bag;
        for (var i = 0; i < soItems.length; i++) {
            item = soItems[i].item;
            qty = soItems[i].quantity;
            priceLevel = soItems[i].pricelevel;
            rate = soItems[i].rate;
            amount = soItems[i].amount;
            bag = soItems[i].bag
            bagArray.push(bag)
            invDtl = soItems[i].inventorydetail;

            soRec.selectNewLine('item');
            _setCurrentSublistValue(soRec, 'item', 'item', item, false);
            _setCurrentSublistValue(soRec, 'item', 'quantity', qty, false);
            _setCurrentSublistValue(soRec, 'item', 'price', priceLevel, false);
            _setCurrentSublistValue(soRec, 'item', 'rate', rate, false);
            _setCurrentSublistValue(soRec, 'item', 'amount', amount, false);
            _setCurrentSublistValue(soRec, 'item', 'custcol_kd_baglabel_link', bag, false);
            soRec.commitLine('item');
        }

        var soId = soRec.save()
        try {


            if (soId) {
                for (var i = 0; i <bagArray.length; i++) {
                    var tagLabel =  record.submitFields({
                        type:'customrecord_kd_taglabel',
                        id: bagArray[i],
                        values: {
                            custrecord157: soId,
                            custrecord_kd_mfgso_date:soRec.getValue('trandate')
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug('Tag label updated', tagLabel)
                }
                try {
                    var packageSearchObj = search.load({
                        id: RETURN_PACKAGE_SEARCH
                    });
                    packageSearchObj.filters.push(search.createFilter({
                        name: "custrecord_kod_packrtn_rtnrequest",
                        operator: 'anyof',
                        values: returnRequestRec.id
                    }))
                    packageSearchObj.run().each(function (result) {

                        var returnPackage = record.load({
                            type:'customrecord_kod_mr_packages',
                            id: result.id,
                            isDynamic: true,
                        });
                        var mfgSO = returnPackage.getValue('custrecord_kd_mfg_so')
                        log.audit('MFG SO',mfgSO)
                        if(mfgSO.indexOf(soId.toString()) === -1){
                            mfgSO.push(soId.toString())
                            log.audit('AAA Updating RP')
                            log.audit('MFG SO',mfgSO)
                            returnPackage.setValue({fieldId: 'custrecord_kd_mfg_so', value: mfgSO})
                        }
                        var rpId = returnPackage.save({ignoreMandatoryFields: true})
                        log.audit('Return Packages Updated', rpId)

                        return true;
                    });
                } catch (e) {
                    log.error(e.message,soId)
                }

                // var tagLabelSearch = search.load({
                //     id: 'customsearch_kd_tag_label_search'
                // })
                // log.debug('Tag Label Search', tagLabelSearch)
                // tagLabelSearch.filters.push(search.createFilter({
                //     name: 'custrecord_kd_tag_return_request',
                //     operator: 'anyof',
                //     values:  returnRequestRec.id
                // }));
                // var searchResultCount = tagLabelSearch.runPaged().count;
                // if (searchResultCount > 0) {
                //     tagLabelSearch.run().each(function (result) {
                //         var tagId = result.id
                //         var tagLabelId = record.submitFields({
                //             type: 'customrecord_kd_taglabel',
                //             id: tagId,
                //             values: {
                //                 custrecord157: soId,
                //                 custrecord_kd_mfgso_date: soRec.getValue('trandate')
                //             },
                //             options: {
                //                 enableSourcing: false,
                //                 ignoreMandatoryFields: true
                //             }
                //         });
                //
                //         log.debug('Tag label Id: ' , tagLabelId )
                //         return true;
                //     });
                // }

            }
        } catch (e) {
            log.error(e.message)
        }
        return soId
        // return (soRec.save());
    }

    function updateSoInventoryDetail(soId, soItems) {
        var soRec = record.load({
            type: record.Type.SALES_ORDER,
            id: soId,
            isDynamic: true,
        });

        var isNumbered;
        var invDtl, invDtlNum, invDtlQty, invDtlExpDate;
        for (var i = 0; i < soRec.getLineCount('item'); i++) {
            soRec.selectLine({
                sublistId: 'item',
                line: i
            });

            var subRec = soRec.getCurrentSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail'
            });

            invDtl = soItems[i].inventorydetail;
            log.debug('updateSoInventoryDetail', JSON.stringify(invDtl));
            for (var j = 0; j < invDtl.length; j++) {
                invDtlNum = invDtl[j].invnum;
                invDtlQty = invDtl[j].quantity;
                invDtlExpDate = invDtl[j].expdate;
                log.debug('updateSoInventoryDetail', 'invDetail num: ' + invDtlNum + '; qty: ' + invDtlQty + '; expdate: ' + invDtlExpDate)
                subRec.selectNewLine({
                    sublistId: 'inventoryassignment',
                });

                subRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: invDtlQty
                });

                subRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber',
                    value: invDtlNum
                });

                subRec.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'expirationdate',
                    value: invDtlExpDate
                });

                subRec.commitLine({
                    sublistId: 'inventoryassignment'
                });
            }

            soRec.commitLine({
                sublistId: 'item'
            });
        }

        var soId = soRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('updateSoInventoryDetail', 'SO ID: ' + soId)
    }

    function createManufAndWhslSalesOrder(returnRequestRec) {
        var soId;
        for (var manuf in soItemsByManuf) {
            soId = createSalesOrder(manuf, soItemsByManuf[manuf], returnRequestRec);
            updateSoInventoryDetail(soId, soItemsByManuf[manuf]);

            log.debug('createManufAndWhslSalesOrder', 'manuf ' + manuf + ' SO ' + soId);
        }

        for (var whslr in soItemsByWhslr) {
            soId = createSalesOrder(whslr, soItemsByWhslr[whslr], returnRequestRec);
            updateSoInventoryDetail(soId, soItemsByWhslr[whslr]);
            log.debug('createManufAndWhslSalesOrder', 'whslr ' + whslr + ' SO ' + soId);
        }
    }

    function getItemsRequested(mrrId) {
        /*var searchRs = search.load({
            id: SEA_RETURN_ITEM_RQSTD,
            filters: search.createFilter({
                name: 'custrecord_kd_rir_masterid',
                operator: search.Operator.ANYOF,
                values: mrrId
            })
        }).run().getRange({ start: 0, end: 1000 });
        var itemsRequested = [];
        var rirId, item, itemDesc, itemNdc, qty, fulPar;
        log.debug('test', JSON.stringify(searchRs));*/

        var objSearch = search.load({
            id: SEA_RETURN_ITEM_RQSTD
        })
        objSearch.filters.push(search.createFilter({
            name: 'custrecord_kd_rir_masterid',
            operator: search.Operator.ANYOF,
            values: mrrId
        }));
        var searchRs = objSearch.run().getRange({start: 0, end: 1000});
        var itemsRequested = [];
        var rirId, item, displayName, itemNdc, qty, fulPar, form222No, form222RefNo, form222RefNoId;
        log.debug('getItemsRequested', 'searchRs: ' + JSON.stringify(searchRs));

        /*var objSearch = search.create({
            type: search.Type.SALES_ORDER,
            title: 'My Second SalesOrder Search',
            id: 'customsearch_my_second_so_search',
            columns: [{
                name: 'id'
            }, {
                name: 'custrecord_kd_rir_item'
            }, {
                name: 'displayname',
                join: 'CUSTRECORD_KD_RIR_ITEM'
            }, {
                name: 'custitem_kod_item_ndc',
                join: 'CUSTRECORD_KD_RIR_ITEM'
            }, {
                name: 'custrecord_kd_rir_fulpar'
            }, {
                name: 'custrecord_kd_rir_masterid'
            }],
            filters: [{
                name: 'custrecord_kd_rir_masterid',
                operator: 'anyof',
                values: [mrrId]
            }]
        });
        var searchRs = objSearch.run().getRange({ start: 0, end: 1000 });
        var itemsRequested = [];
        var rirId, item, itemDesc, itemNdc, qty, fulPar;
        log.debug('test', JSON.stringify(searchRs));*/

        for (var i = 0; i < searchRs.length; i++) {
            rirId = searchRs[i].getValue({
                name: 'id'
            });
            item = searchRs[i].getValue({
                name: 'custrecord_kd_rir_item'
            });
            displayName = searchRs[i].getValue({
                name: 'displayname',
                join: 'custrecord_kd_rir_item'
            });
            if (displayName == '') {
                displayName = searchRs[i].getText({
                    name: 'custrecord_kd_rir_item'
                });
            }
            itemNdc = searchRs[i].getValue({
                name: 'custitem_kod_item_ndc',
                join: 'custrecord_kd_rir_item'
            });
            qty = searchRs[i].getValue({
                name: 'custrecord_kd_rir_quantity'
            });
            fulPar = searchRs[i].getValue({
                name: 'custrecord_kd_rir_fulpar'
            });
            form222No = searchRs[i].getValue({
                name: 'custrecord_kd_rir_form_222_no'
            });
            form222RefNo = searchRs[i].getText({
                name: 'custrecord_kd_rir_form222_ref'
            });
            form222RefNoId = searchRs[i].getValue({
                name: 'custrecord_kd_rir_form222_ref'
            });

            itemsRequested.push({
                id: rirId,
                item: item,
                displayname: displayName,
                ndc: itemNdc,
                qty: qty,
                fulpar: fulPar,
                form222No: form222No,
                form222RefNo: form222RefNo,
                form222RefNoId: form222RefNoId
            });
        }

        log.debug('getItemsRequested', 'object generated: ' + JSON.stringify(itemsRequested));
        return itemsRequested;
    }

    function addC2ItemsReqSublist(context) {
        context.form.addTab({
            id: 'custpage_tab_items_requested',
            label: 'C2 Items Requested'
        });
        log.debug('addC2ItemsReqSublist', 'Added Items Requested tab')

        var objSublist = context.form.addSublist({
            id: 'custpage_sublist_items_requested',
            type: serverWidget.SublistType.LIST,
            label: 'Items Requested',
            tab: 'custpage_tab_items_requested'
        });
        objSublist.addField({
            id: 'custpage_edit',
            type: serverWidget.FieldType.TEXT,
            label: 'Edit'
        });
        /*var editField = objSublist.addField({
            id : 'custpage_edit',
            type : serverWidget.FieldType.URL,
            label : 'Edit'
        });
        editField.linkText = 'EDIT';*/
        /*objSublist.addField({
            id: 'custpage_edit',
            label: 'Edit',
            type: serverWidget.FieldType.URL,
            source: null
        }).linkText = 'EDIT';*/
        objSublist.addField({
            id: 'custpage_col_id',
            label: 'ID',
            type: serverWidget.FieldType.SELECT,
            source: 'customrecord_kod_mr_item_request'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item',
            label: 'Item',
            type: serverWidget.FieldType.SELECT,
            source: 'item'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_description',
            label: 'Item Description',
            type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_ndc',
            label: 'Item NDC',
            type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_qty',
            label: 'Quantity',
            type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_ful_par',
            label: 'Full/Partial',
            type: serverWidget.FieldType.SELECT,
            source: 'customlist_kod_fullpartial'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_form_222_no',
            label: 'Form 222 No.',
            type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });
        objSublist.addField({
            id: 'custpage_col_item_form_222_ref_no',
            type: serverWidget.FieldType.TEXT,
            label: 'Form 222 Ref No.'
        });
        /*objSublist.addField({
            id: 'custpage_col_item_form_222_ref_no',
            label: 'Form 222 Ref No.',
            type: serverWidget.FieldType.TEXT
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });*/
        var itemsRequested = getItemsRequested(context.newRecord.getValue(FLD_RETREQ_MRR));
        log.debug('addC2ItemsReqSublist', 'return request id: ' + context.newRecord.getValue(FLD_RETREQ_MRR));
        log.debug('addC2ItemsReqSublist', 'itemsRequested: ' + JSON.stringify(itemsRequested));
        //var netsuiteSiteUrl = getDataCenterURL();
        var domain = url.resolveDomain({
            hostType: url.HostType.APPLICATION
        });
        //itemsRequested = itemsRequested[0];
        for (var i = 0; i < itemsRequested.length; i++) {
            log.debug('TEST HERE', i)
            var editUrl = url.resolveRecord({
                recordType: 'customrecord_kod_mr_item_request',
                recordId: itemsRequested[i].id,
                isEditMode: true
            });
            var lineUrl = 'https://' + domain + editUrl;
            objSublist.setSublistValue({
                id: 'custpage_edit',
                line: i,
                value: '<a href="' + lineUrl + '">EDIT</a>'
            });
            /*contacts.setSublistValue({
                id: 'edit',
                line: ctr,
                value: 'https://' + domain + editUrl
            });*/
            /*objSublist.setSublistValue({
                id: 'custpage_edit',
                line: i,
                value: 'https://' + domain + editUrl
            });*/
            objSublist.setSublistValue({
                id: 'custpage_col_id',
                value: itemsRequested[i].id,
                line: i
            });
            objSublist.setSublistValue({
                id: 'custpage_col_item',
                value: itemsRequested[i].item,
                line: i
            });
            objSublist.setSublistValue({
                id: 'custpage_col_item_description',
                value: itemsRequested[i].displayname,
                line: i
            });
            objSublist.setSublistValue({
                id: 'custpage_col_item_ndc',
                value: itemsRequested[i].ndc,
                line: i
            });
            if(itemsRequested[i].qty != ''){
                objSublist.setSublistValue({
                    id: 'custpage_col_item_qty',
                    value: itemsRequested[i].qty,
                    line: i
                });
            }
            objSublist.setSublistValue({
                id: 'custpage_col_item_ful_par',
                value: itemsRequested[i].fulpar,
                line: i
            });
            if (itemsRequested[i].form222No != '') {
                objSublist.setSublistValue({
                    id: 'custpage_col_item_form_222_no',
                    value: itemsRequested[i].form222No,
                    line: i
                });
            }
            if (itemsRequested[i].form222RefNo != '') {
                objSublist.setSublistValue({
                    id: 'custpage_col_item_form_222_ref_no',
                    value: itemsRequested[i].form222RefNo,
                    line: i
                });
                var form222RefNoViewUrl = url.resolveRecord({
                    recordType: 'customrecord_kd_222formrefnum',
                    recordId: itemsRequested[i].form222RefNoId,
                    isEditMode: false
                });
                var lineUrl = 'https://' + domain + editUrl;
                objSublist.setSublistValue({
                    id: 'custpage_col_item_form_222_ref_no',
                    line: i,
                    value: '<a href="' + form222RefNoViewUrl + '">'+itemsRequested[i].form222RefNo+'</a>'
                });
            }
        }
    }

    function haveItemForBagLabel(recReturnRequest) {
        //var rrCategory = recReturnRequest.getValue(FLD_RETREQ_CATEGORY);
        var rrItemsSearch = search.create({
            type: REC_RETURN_REQUEST,
            columns: [search.createColumn({
                name: 'internalid',
                summary: search.Summary.COUNT
            })],
            filters: [{
                name: 'name',
                join: 'item',
                operator: 'startswith',
                values: 'Unidentified'
            },/*{
        name: 'custcol_kd_baglabel_link',
        operator: 'anyof',
        values: ['@NONE@']
    },*/{
                name: 'internalid',
                operator: 'anyof',
                values: [recReturnRequest.id]
            }]
        });
        var rs = rrItemsSearch.run().getRange(0,1);
        var rsCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
        log.debug('', 'Unidentified Item Count: ' + rsCount);
        var haveUnidentifiedItem = false;
        if(rsCount > 0){
            haveUnidentifiedItem = true;
        }

        var haveItemWithoutBag = false;
        for(var rrLineNo = 0; rrLineNo < recReturnRequest.getLineCount('item'); rrLineNo++){
            log.debug('', 'line check: ' + rrLineNo)
            if(recReturnRequest.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_baglabel_link',
                line: rrLineNo
            }) == ''){
                haveItemWithoutBag = true;
                break;
            }
        }
        log.debug('', 'haveUnidentifiedItem ' + haveUnidentifiedItem);
        log.debug('', 'haveItemWithoutBag ' + haveItemWithoutBag)

        if(!haveUnidentifiedItem && haveItemWithoutBag)
            return true;
        return false;
        /*var rrItemsSearch = search.load({
            id: SEA_RET_REQ_ITEMS
        });
        rrItemsSearch.filters.push(search.createFilter({
            name: 'name',
            join: 'item',
            operator: search.Operator.STARTSWITH,
            values: 'Unidentified'
        }));
        rrItemsSearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: recReturnRequest.id
        }));

        var searchRs = rrItemsSearch.run().getRange({start: 0, end: 1000});

        if (searchRs.length > 0) {
            return false;
        }

        return true;*/
    }
    function rrHasReturnItemRequested(rrId) {
        var rirSearch = search.create({
            type: REC_RETURN_ITEM_REQUESTED,
            columns: [search.createColumn({
                name: 'internalid',
                summary: search.Summary.COUNT
            })],
            filters: [{
                name: FLD_RIR_RR,
                operator: 'anyof',
                values: [rrId]
            },{
                name: FLD_RIR_CATEGORY,
                operator: 'anyof',
                values: [CATEGORY_C2]
            }]
        });
        var rs = rirSearch.run().getRange(0,1);
        var rirCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
        log.debug('rrHasReturnItemRequested', 'RIR COUNT: ' + rirCount);
        if(rirCount > 0){
            return true;
        }
        return false;
    }
    function beforeLoad(context) {
        var returnRequestRec = context.newRecord;
        if (context.type == 'create')
            return;

        if (parseInt(context.newRecord.getValue(FLD_RETREQ_CATEGORY)) == CATEGORY_C2) {
            if(returnRequestRec.getValue(FLD_RETREQ_MRR))
                addC2ItemsReqSublist(context);

            if (returnRequestRec.getValue('transtatus') != 'A' && returnRequestRec.getValue('transtatus') != 'B' && returnRequestRec.getValue('transtatus') != 'I' && returnRequestRec.getValue('transtatus') != 'K'){//authorized - C

                context.form.addButton({
                    id : 'custpage_btn_create222form',
                    label : 'Create 222 Reference',
                    functionName: "create222Reference"
                });
                if(!returnRequestRec.getValue('custbody_kd_for_222_form_assignment')){
                    context.form.addButton({
                        id : 'custpage_btn_assign222form',
                        label : 'Assign 222 Reference',
                        functionName: "assign222Form"
                    });
                }
                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_RR]
                    ]
                }).run().getRange({ start: 0, end: 1 });
                log.debug('test', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
            }

            if (returnRequestRec.getText('transtatus').toUpperCase() == 'PENDING REVIEW' && context.type == 'view') {
                /*var updateNoC2FormsUrl = url.resolveScript({
                    scriptId: 'customscript_kd_sl_update_no_c2_forms',
                    deploymentId: 'customdeploy_kd_sl_update_no_c2_forms'
                });

                updateNoC2FormsUrl += '&custscript_id=' + context.newRecord.id;
                log.debug('test', 'updateNoC2FormsUrl ' + updateNoC2FormsUrl);
                context.form.addButton({
                    id : 'custpage_update_no_c2_forms',
                    label : 'Update No. of C2 Forms',
                    functionName: "window.open('" + updateNoC2FormsUrl + "');"
                });*/

                /*var btnUpdateNoC2Forms = context.form.addButton({
                    id: 'custpage_update_no_c2_forms',
                    label: 'Update No. of C2 Forms',
                    functionName: 'updateNoC2Forms("' + context.newRecord.id + '")'
                });*/

                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_RR]
                    ]
                }).run().getRange({start: 0, end: 1});
                log.debug('test', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
                log.debug('authorize button', context.newRecord.getValue('custbody_kd_rr_category') + ' : ' + context.newRecord.getValue('custbody_kd_c2_no_of_labels') + ' : ' + runtime.getCurrentUser().role)
                if (context.newRecord.getValue('custbody_kd_rr_category') == 3 && context.newRecord.getValue('custbody_kd_c2_no_of_labels') != '' && context.newRecord.getValue('custbody_kd_license_expired') == false && (runtime.getCurrentUser().role == 3 || runtime.getCurrentUser().role == 1028)) {
                    //{custbody_kd_rr_category.id}=3 and {userrole.id} in (3,1028) and {custbody_kd_c2_no_of_labels} is not null
                    //check on rir if more than 2
                    /*if (returnRequestRec.getLineCount('custpage_sublist_items_requested') > 1) {
                        context.form.addButton({
                            id: 'custpage_btn_update_no_form_222',
                            label: 'Update No. of Form 222',
                            functionName: 'updateNoForm222("' + context.newRecord.id + '")'
                        });
                    }*/

                    /*context.form.addButton({
                        id: 'custpage_btn_auto_assign_form_222',
                        label: 'Auto Assign Form 222',
                        functionName: 'autoAssignForm222("' + context.newRecord.id + ',' + returnRequestRec.getValue(FLD_RETREQ_MRR) + '")'
                    });*/

                    /*context.form.addButton({
                        id: 'custpage_btn_form222',
                        label: 'Generate Form 222',
                        functionName: "createForm222"
                    });*/

                    /*context.form.addButton({
                        id: 'custpage_btn_authorize',
                        label: 'Authorize',
                        functionName: "authorize"
                    });*/
                    var fileId = search.create({
                        type: 'file',
                        filters: [
                            ['name', 'is', SCR_FILE_NAME_CS_RR]
                        ]
                    }).run().getRange({start: 0, end: 1});
                    log.debug('test', 'cs file id: ' + fileId[0].id);
                    context.form.clientScriptFileId = fileId[0].id;
                }
            }
            //C2 Kit to be Mailed
            if (returnRequestRec.getValue('transtatus') == 'J') {
                context.form.addButton({
                    id : 'custpage_btn_generate_outbound_label',
                    label : 'Generate Outbound Label',
                    functionName: "generateOutboundLabel"
                });
                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_RR]
                    ]
                }).run().getRange({ start: 0, end: 1 });
                log.debug('test', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
            }
        }
        //Status is Authorized (C)
        if ((returnRequestRec.getValue('transtatus') == 'C' ||
            returnRequestRec.getValue('transtatus') == 'D' ||
            returnRequestRec.getValue('transtatus') == 'E' ||
            returnRequestRec.getValue('transtatus') == 'F' ||
            returnRequestRec.getValue('transtatus') == 'G' ||
            returnRequestRec.getValue('transtatus') == 'J' ||
            returnRequestRec.getValue('transtatus') == 'K') &&
            context.type == 'view' &&
            rrHasReturnItemRequested(returnRequestRec.id)
        ) {
            /*context.form.addButton({
                id : 'custpage_btn_form222',
                label : 'Generate Form 222',
                functionName: "createForm222"
            });*/
            /*var fileId = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', SCR_FILE_NAME_CS_RR]
                ]
            }).run().getRange({ start: 0, end: 1 });
            log.debug('test', 'cs file id: ' + fileId[0].id);
            context.form.clientScriptFileId = fileId[0].id;*/
        }
        //if((returnRequestRec.getText('transtatus').toUpperCase() == 'PROCESSING' || returnRequestRec.getText('transtatus').toUpperCase() == 'PROCESSED/PENDING APPROVAL') && context.type == 'view'){
        if (returnRequestRec.getValue('transtatus') == 'F' && context.type == 'view') {
            /*var btnApplyReturnPolicy = context.form.addButton({
                id: 'custpage_apply_return_policy',
                label: 'Apply Return Policy',
                functionName: 'applyReturnPolicy'
            });*/
            var fileId = search.create({
                type: 'file',
                filters: [
                    ['name', 'is', SCR_FILE_NAME_CS_RR]
                ]
            }).run().getRange({start: 0, end: 1});
            log.debug('test', 'cs file id: ' + fileId[0].id);
            context.form.clientScriptFileId = fileId[0].id;
        } else if (returnRequestRec.getValue('transtatus') == 'K' && context.type == 'view') {

            if (haveItemForBagLabel(returnRequestRec)) {

                context.form.addButton({
                    id: 'custpage_create_tag_label',
                    label: 'Create Tag Label',
                    functionName: 'createTagLabel'
                });
                var fileId = search.create({
                    type: 'file',
                    filters: [
                        ['name', 'is', SCR_FILE_NAME_CS_RR]
                    ]
                }).run().getRange({start: 0, end: 1});

                log.debug('test', 'cs file id: ' + fileId[0].id);
                context.form.clientScriptFileId = fileId[0].id;
            } else {
                log.debug('test', 'have unidentified items')
            }
        }
    }
    function getItemPricingOrderAndPriceLevelAmounts(returnRequestRec){
        var itemId, rrItems = [], pricingOrders = [], rrItemPricingOrderAndPriceLevelAmounts = {};
        for(var indx = 0; indx < returnRequestRec.getLineCount('item'); indx++){
            itemId = returnRequestRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: indx
            });
            if (itemId != 649) {
                if(rrItems.indexOf(itemId) < 0){
                    rrItems.push(itemId);
                }
            }
        }
        if(rrItems.length > 0){
            var filters = new Array();
            filters[0] = search.createFilter({
                name: 'internalID',
                operator: search.Operator.ANYOF,
                values: rrItems
            });
            var columns = new Array();
            columns[0] = search.createColumn({
                name: 'custitem_kodella_pricingorder'
            });
            columns[1] = search.createColumn({
                name: 'price8'
            });
            columns[2] = search.createColumn({
                name: 'price9'
            });
            columns[3] = search.createColumn({
                name: 'price10'
            });
            var mySearch = search.create({
                type: search.Type.ITEM,
                filters: filters,
                columns: columns
            })
            var result = mySearch.run();
            var pharmaPricingOrder, pharmaCalc, pharmaCalc1, pharmaCalc2;

            result.each(function (row) {
                itemId = row.id;
                pharmaPricingOrder = row.getValue({
                    name: 'custitem_kodella_pricingorder'
                })
                pharmaCalc = row.getValue({
                    name: 'price8'
                })
                pharmaCalc1 = row.getValue({
                    name: 'price9'
                })
                pharmaCalc2 = row.getValue({
                    name: 'price10'
                })
                rrItemPricingOrderAndPriceLevelAmounts[itemId] = {
                    pricing_order: pharmaPricingOrder,
                    8: pharmaCalc,
                    9: pharmaCalc1,
                    10: pharmaCalc2
                };
                pricingOrders.push(pharmaPricingOrder);
                return true;
            });
        }
        return {rr_item_pricing_order_and_pricelvl_amts: rrItemPricingOrderAndPriceLevelAmounts, pricing_orders: pricingOrders};
    }
    function getPricingOrdersPriceLevelOrder(pricingOrders){
        for(var poIndx = pricingOrders.length-1; poIndx >= 0 ; poIndx--){
            if(pricingOrders[poIndx] == null || pricingOrders[poIndx] == '')
                pricingOrders.splice(poIndx, 1);
        }

        var pricingOrdersPriceLevelOrder = {};
        if(pricingOrders.length > 0){
            var pharmaPricingOrderId, priceLevel1, priceLevel2, priceLevel3;
            var mySearch = search.create({
                type: 'customrecord_kodella_prclvlpriorder',
                filters: [{
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: pricingOrders
                }],
                columns: [
                    search.createColumn({
                        name: 'custrecord_kodella_prclvl1'
                    }),
                    search.createColumn({
                        name: 'custrecord_kodella_prclvl2'
                    }),
                    search.createColumn({
                        name: 'custrecord_kodella_prclvl3'
                    })]
            });
            var result = mySearch.run();
            result.each(function (row) {
                pharmaPricingOrderId = row.id;
                priceLevel1 = row.getValue({
                    name: 'custrecord_kodella_prclvl1'
                })
                priceLevel2 = row.getValue({
                    name: 'custrecord_kodella_prclvl2'
                })
                priceLevel3 = row.getValue({
                    name: 'custrecord_kodella_prclvl3'
                })
                pricingOrdersPriceLevelOrder[pharmaPricingOrderId] = {
                    pricelevel1: priceLevel1,
                    pricelevel2: priceLevel2,
                    pricelevel3: priceLevel3
                };
                return true;
            })
        }
        return pricingOrdersPriceLevelOrder;
    }
    function updatePriceLevel(returnRequestRec){
        var objReturn = getItemPricingOrderAndPriceLevelAmounts(returnRequestRec);
        var pricingOrders = objReturn.pricing_orders;
        var rrItemPricingOrdersAndPriceLevelAmounts = objReturn.rr_item_pricing_order_and_pricelvl_amts;
        var pricingOrdersPriceLevelOrder = getPricingOrdersPriceLevelOrder(pricingOrders);

        log.debug('updatePriceLevel', JSON.stringify(pricingOrders));
        log.debug('updatePriceLevel', JSON.stringify(rrItemPricingOrdersAndPriceLevelAmounts));
        log.debug('updatePriceLevel', JSON.stringify(pricingOrdersPriceLevelOrder));

        var itemId, pharmaProcessing, itemPricingOrderAndPriceLevelAmounts, itemPricingOrder, pricingOrder, pricingOrderPriceLevel1, pricingOrderPriceLevel1, pricingOrderPriceLevel1, priceLevelToUse;
        var rrRec = record.load({
            type: 'customsale_kod_returnrequest',
            id: returnRequestRec.id,
            isDynamic: true,
        });
        for(var indx = 0; indx < rrRec.getLineCount('item'); indx++){
            priceLevelToUse = '';
            rrRec.selectLine({
                sublistId: 'item',
                line: indx
            });
            itemId = rrRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            if (itemId == 649) {
                try{
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price',
                        value: 7 //NONRETURNABLE
                    });
                }catch(ex){
                    log.debug('NONRETURNABLE_SET_PRICE_LEVEL', 'Non-Returnable Price Level is not available for the item.')
                }
            }else{
                pharmaProcessing = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RET_REQ_IT_PROCESSING
                });
                //if(pharmaProcessing == PROCESSING_RETURNABLE){
                    itemPricingOrderAndPriceLevelAmounts = rrItemPricingOrdersAndPriceLevelAmounts[itemId];
                    itemPricingOrder = itemPricingOrderAndPriceLevelAmounts.pricing_order;
                    if(itemPricingOrder){
                        pricingOrder = pricingOrdersPriceLevelOrder[itemPricingOrder];
                        log.debug('updatePriceLevel', JSON.stringify(pricingOrder));
                        pricingOrderPriceLevel1 = pricingOrder['pricelevel1'];
                        pricingOrderPriceLevel2 = pricingOrder['pricelevel2'];
                        pricingOrderPriceLevel3 = pricingOrder['pricelevel3'];

                        var priceLevel1Amount = itemPricingOrderAndPriceLevelAmounts[pricingOrderPriceLevel1];
                        var priceLevel2Amount = itemPricingOrderAndPriceLevelAmounts[pricingOrderPriceLevel2];
                        var priceLevel3Amount = itemPricingOrderAndPriceLevelAmounts[pricingOrderPriceLevel3];

                        log.debug('TEST', 'price1 ' + priceLevel1Amount);
                        log.debug('TEST', 'price2 ' + priceLevel2Amount);
                        log.debug('TEST', 'price3 ' + priceLevel3Amount);

                        if (itemPricingOrder) {
                            if (priceLevel1Amount > 0) {
                                priceLevelToUse = pricingOrderPriceLevel1;
                                log.debug('TEST', 'setting to ' + pricingOrderPriceLevel1);
                            } else if (priceLevel2Amount > 0) {
                                priceLevelToUse = pricingOrderPriceLevel2;
                                log.debug('TEST', 'setting to ' + pricingOrderPriceLevel2);
                            } else {
                                priceLevelToUse = pricingOrderPriceLevel3;
                                //if(priceLevel3Amount == null || priceLevel3Amount == undefined)
                                //    priceLevelToUse = '';
                                log.debug('TEST', 'setting to ' + pricingOrderPriceLevel3);
                            }
                            if(priceLevelToUse != ''){
                                rrRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'price',
                                    value: priceLevelToUse
                                });
                            }
                        }
                    }
                /*}else if(pharmaProcessing == PROCESSING_NONRETURNABLE){
                    try{
                        rrRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: 7
                        });
                    }catch(ex){
                        log.debug('NONRETURNABLE_SET_PRICE_LEVEL', 'Non-Returnable Price Level is not available for the item.')
                    }
                }*/
            }
            rrRec.commitLine('item');
        }
        rrRec.save();
    }
    function afterSubmit(context) {
        log.debug('afterSubmit', context.newRecord.getValue(FLD_RETREQ_CATEGORY) + ' : ' + context.newRecord.getText('transtatus').toUpperCase());
        log.debug('afterSubmit', context.type);

        if (context.type == context.UserEventType.CREATE)
            return;
        var returnRequestOldRec = context.oldRecord;
        var returnRequestRec = context.newRecord;

        log.debug('afterSubmit', returnRequestRec.getValue(FLD_RETREQ_CATEGORY) + ' : ' + returnRequestRec.getText('transtatus').toUpperCase());
        log.debug('afterSubmit', JSON.stringify(returnRequestOldRec));
        log.debug('afterSubmit TEST', returnRequestRec.getValue('transtatus') + ' : ' + returnRequestRec.getValue('custbody_kd_rr_for_tag_label_gen'));
        if ((returnRequestRec.getValue('transtatus') == 'F' || returnRequestRec.getValue('transtatus') == 'K') && context.type == context.UserEventType.EDIT){
        //if ((returnRequestRec.getValue('transtatus') == 'K') && context.type == context.UserEventType.EDIT){
            try {
              updatePriceLevel(returnRequestRec);
            } catch (e) {
                log.error(e.message)
            }
        }
        var rrCategory = returnRequestRec.getValue(FLD_RETREQ_CATEGORY)? returnRequestRec.getValue(FLD_RETREQ_CATEGORY) : returnRequestOldRec.getValue(FLD_RETREQ_CATEGORY);
        var rrStatus = returnRequestRec.getValue('transtatus')? returnRequestRec.getValue('transtatus') : returnRequestOldRec.getValue('transtatus');
        log.debug('TEST HERE', rrCategory + ' == ' + CATEGORY_C2 + ' && ' + rrStatus + ' == C &&' + returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) + ' &&('+ returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) + ' != ' + returnRequestOldRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) +')');
        //if(parseInt(rrCategory) == CATEGORY_C2 && rrStatus == 'C' && returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) && (returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) != returnRequestOldRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT))){
        if(parseInt(rrCategory) == CATEGORY_C2 && returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) && (returnRequestRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT) != returnRequestOldRec.getValue(FLD_RETREQ_FOR_222_FORM_ASSIGNMENT))){
            log.debug('TEST HERE', 'TO SCHEDULE');
            try{
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_kd_mr_assign_222_form',
                    deploymentId: 'customdeploy_kd_mr_assign_222_form'/*,
            params: {
                custscript_mrr_id: mrrRec.id
            }*/
                });
                var mrTaskId = mrTask.submit();
                /*var mrTaskStatus = task.checkStatus({
                    taskId: mrTaskId
                });*/
                log.debug('test', 'scheduled for tag creation');
                //if(mrTaskStatus == FAILED)
            }catch(ex){
                log.error({title: 'map/reduce task creation', details: ex });
            }
        }
        if (returnRequestRec.getValue('transtatus') != returnRequestOldRec.getValue('transtatus') && returnRequestRec.getText('transtatus').toUpperCase() == 'APPROVED') {
            var rmaId = createRma(returnRequestRec);
            receiveRma(rmaId, returnRequestRec);
            //createCreditMemo(rmaId, returnRequestRec);
            //get items for manuf and for wholesale SO
            getItemsByManufAndWhslr(returnRequestRec);
            createManufAndWhslSalesOrder(returnRequestRec);
            createPharmacyInvoice(returnRequestRec);
            applyPaymentDueDate(returnRequestRec);
        } else if (returnRequestRec.getValue('transtatus') != returnRequestOldRec.getValue('transtatus') && returnRequestRec.getValue('transtatus') == 'H') {
            //}else if(returnRequestRec.getValue('transtatus') == 'H'){
            //var trxnToDeleteSearch = search.load('');
            var objSearch = search.load({
                id: 'customsearch_kd_rr_trxn_delete_on_reject'
            })
            objSearch.filters.push(search.createFilter({
                name: 'custbody_kd_return_request',
                operator: search.Operator.ANYOF,
                values: returnRequestRec.id
            }));
            var searchRs = objSearch.run().getRange({start: 0, end: 1000});
            var trxnType, trxnId;
            log.debug('getTransactionsToDelete', JSON.stringify(searchRs));

            for (var i = 0; i < searchRs.length; i++) {
                trxnType = searchRs[i].recordType;
                trxnId = searchRs[i].id;

                try {
                    record.delete({
                        type: trxnType,
                        id: trxnId
                    });
                } catch (ex) {
                    log.error('ERR', 'Failed to delete ' + trxnType + ' ' + trxnId);
                }
            }
            //}else if(parseInt(returnRequestRec.getValue(FLD_RETREQ_CATEGORY)) == parseInt(3) && returnRequestRec.getValue('transtatus') != returnRequestOldRec.getValue('transtatus') && returnRequestRec.getText('transtatus').toUpperCase() == 'AUTHORIZED'){
            //}else if(returnRequestRec.getText('transtatus').toUpperCase() == 'PENDING REVIEW'){
        } else if (parseInt(returnRequestRec.getValue(FLD_RETREQ_CATEGORY)) == parseInt(3) && returnRequestRec.getValue('transtatus') == 'A') {
            var generatePdfUrl = url.resolveScript({
                scriptId: SCR_ID_GENERATE_FORM_222,
                deploymentId: DPLYMNT_GENERATE_FORM_222
            });
            log.debug('afterSubmit', generatePdfUrl + ' >> ' + returnRequestRec.id);
            /*redirect.redirect({
                url: generatePdfUrl+'&id='+context.newRecord.id
            });*/
            redirect.toSuitelet({
                scriptId: SCR_ID_GENERATE_FORM_222,
                deploymentId: DPLYMNT_GENERATE_FORM_222,
                parameters: {
                    'custscript_kd_rr_id': returnRequestRec.id
                }
            });
            // move the status to next stage after generation of the form 222 pdf
            /*var rrId = record.submitFields({
                type: 'customsale_kod_returnrequest',
                id: context.newRecord.id,
                values: {
                    'transtatus': 'D'
                }
            });*/
            //added transition from C2 Kit to be mail to pending package receipt
        } else if (returnRequestRec.getValue('transtatus') == 'J' && returnRequestRec.getValue('custbody_kd_labels_generated') == true && returnRequestRec.getValue('custbody_kd_c2kit_mailed') == true) {
            var id = record.submitFields({
                type: 'customsale_kod_returnrequest',
                id: returnRequestRec.id,
                values: {'transtatus': 'D'},
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        } else if ((returnRequestRec.getValue('transtatus') == 'K' || returnRequestOldRec.getValue('transtatus') == 'K') && returnRequestRec.getValue('custbody_kd_rr_for_tag_label_gen')) {
            log.debug('test', 'entered here');
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_kd_mr_create_tag_labels',
                deploymentId: 'customdeploy_kd_mr_create_tag_labels'/*,
        params: {
            custscript_mrr_id: mrrRec.id
        }*/
            });
            var mrTaskId = mrTask.submit();
            var mrTaskStatus = task.checkStatus({
                taskId: mrTaskId
            });
            log.debug('test', 'scheduled for tag creation');
            //if(mrTaskStatus == FAILED)
        }
        var rrAmountUpdated = false;
        if(returnRequestRec.getText('transtatus').toUpperCase() != 'APPROVED'){
            applyPaymentSchedule(returnRequestRec);
        }else{
            if(returnRequestRec.getValue('custbody_kd_rr_mrr_status') != 12 && returnRequestRec.getValue('custbody_kd_rr_mrr_status') != 10){
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: returnRequestRec.id,
                    isDynamic: true,
                });
                var itPackageSize, partialCount, qty, rate, amount;
                for(var indx = 0; indx < rrRec.getLineCount('item'); indx++){
                    rrRec.selectLine({
                        sublistId: 'item',
                        line: indx
                    });
                    if(rrRec.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == 2){
                        itPackageSize = rrRec.getCurrentSublistValue('item', 'custcol_package_size');
                        itPackageSize = itPackageSize == null || itPackageSize == '' ? 0 : itPackageSize;
                        partialCount = rrRec.getCurrentSublistValue('item', 'custcol_kd_partialcount');
                        qty = rrRec.getCurrentSublistValue('item', 'quantity');
                        rate = rrRec.getCurrentSublistValue('item', 'rate');
                        log.debug('test', 'qty: ' + qty + '; partialCount: ' + partialCount + '; itPackageSize: ' + itPackageSize + '; rate: ' + rate);
                        if(partialCount > 0){
                            amount = (qty *(partialCount / itPackageSize)) * rate;
                            rrRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                value: amount,
                                ignoreFieldChange: true
                            });
                        }
                    }

                    rrRec.commitLine('item');
                }
                rrRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
        }
    }
    function applyPaymentSchedule(returnRequestRec){
        var rrRec = record.load({
            type: 'customsale_kod_returnrequest',
            id: returnRequestRec.id,
            isDynamic: true,
        });
        var updateAmount = rrRec.getValue('custbody_kd_rr_mrr_status') != 12 && rrRec.getValue('custbody_kd_rr_mrr_status') != 10 ? true : false;
        var isInDated = false, isReturnable, rrDate, expiDate, mfgInDays, mfgInDate, diffTime, diffDays, paySchedSearch, paySchedId, paySchedName;
        var itPackageSize, partialCount, qty, rate, amount;
        for(var indx = 0; indx < rrRec.getLineCount('item'); indx++){
            rrRec.selectLine({
                sublistId: 'item',
                line: indx
            });
            isReturnable = rrRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_returnable'
            });

            if(!isReturnable)
                continue;

            isInDated = rrRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_indate_flag'
            });

            if(!isInDated){
                rrRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_pymt_sched',
                    value: 12
                });
            }else{
                rrDate = rrRec.getValue('trandate');
                expiDate = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_expiration'
                });
                mfgInDays = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_rp_mfg_indays'
                });
                if(mfgInDays == '' || mfgInDays == null){
                    mfgInDays = 0;
                }
                mfgInDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), expiDate.getDate());
                mfgInDate.setMonth(mfgInDate.getMonth() - parseInt(mfgInDays));
                diffTime = Math.abs(rrDate - mfgInDate);
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                log.debug('TEST', rrDate + ' : ' + mfgInDate);
                log.debug('TEST', 'diffDays: ' + diffDays);

                paySchedSearch = search.create({
                    type: 'customrecord_kd_payment_schedule',
                    columns: [{
                        name: 'internalid'
                    },{
                        name: 'name'
                    }],
                    filters: [{
                        name: 'custrecord_kd_paysched_min_days',
                        operator: search.Operator.LESSTHANOREQUALTO,
                        values: [diffDays]
                    },{
                        name: 'custrecord_kd_paysched_max_days',
                        operator: search.Operator.GREATERTHANOREQUALTO,
                        values: [diffDays]
                    }]
                });
                paySchedSearchResult = paySchedSearch.run().getRange({ start: 0, end: 1 });
                if(paySchedSearchResult.length > 0){
                    paySchedId = paySchedSearchResult[0].getValue({
                        name: 'internalid'
                    });
                    paySchedName = paySchedSearchResult[0].getValue({
                        name: 'name'
                    });
                    log.debug('TEST', paySchedId + ' : ' + paySchedName);
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_pymt_sched',
                        value: paySchedId
                    });
                }
            }

            if(updateAmount && rrRec.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == 2){
                itPackageSize = rrRec.getCurrentSublistValue('item', 'custcol_package_size');
                itPackageSize = itPackageSize == null || itPackageSize == '' ? 0 : itPackageSize;
                partialCount = rrRec.getCurrentSublistValue('item', 'custcol_kd_partialcount');
                qty = rrRec.getCurrentSublistValue('item', 'quantity');
                rate = rrRec.getCurrentSublistValue('item', 'rate');
                log.debug('test', 'qty: ' + qty + '; partialCount: ' + partialCount + '; itPackageSize: ' + itPackageSize + '; rate: ' + rate);
                if(partialCount > 0){
                    amount = (qty *(partialCount / itPackageSize)) * rate;
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: amount,
                        ignoreFieldChange: true
                    });
                }
            }
            rrRec.commitLine('item');
        }
        rrRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        //custcol_kd_payment_schedule
        //custcol_kd_pymt_due_date
    }
    function applyPaymentDueDate(returnRequestRec){
        var rrRec = record.load({
            type: 'customsale_kod_returnrequest',
            id: returnRequestRec.id,
            isDynamic: true,
        });
        var isInDated = false, isReturnable, paySchedId, termsDaysTillNetDue, dueDate, fieldLookUp, maxDays;
        var rrDate = rrRec.getValue('trandate');
        for(var indx = 0; indx < rrRec.getLineCount('item'); indx++){
            rrRec.selectLine({
                sublistId: 'item',
                line: indx
            });

            isInDated = rrRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_indate_flag'
            });

            isReturnable = rrRec.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_returnable'
            });

            if(!isReturnable)
                continue;

            termsDaysTillNetDue = rrRec.getValue('custbody_kd_terms_days_til_net_due');
            if(termsDaysTillNetDue == '' || termsDaysTillNetDue == null){
                termsDaysTillNetDue = 0;
            }

            if(!isInDated){
                dueDate = new Date(rrDate.getFullYear(), rrDate.getMonth(), rrDate.getDate());
                dueDate.setDate(dueDate.getDate() + parseInt(termsDaysTillNetDue));
                log.debug('test', 'due date: ' + dueDate)
                rrRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_pymt_due_date',
                    value: dueDate
                });
            }else{
                dueDate = new Date(rrDate.getFullYear(), rrDate.getMonth(), rrDate.getDate());
                paySchedId = rrRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_pymt_sched'
                });
                if(paySchedId != '' && paySchedId != null){
                    fieldLookUp = search.lookupFields({
                        type: 'customrecord_kd_payment_schedule',
                        id: paySchedId,
                        columns: ['custrecord_kd_paysched_max_days']
                    });
                    maxDays = fieldLookUp['custrecord_kd_paysched_max_days'];
                    if(maxDays == '' || maxDays == null){
                        maxDays = 0;
                    }
                    log.debug('test', 'max days: ' + maxDays);
                    dueDate.setDate(dueDate.getDate() + parseInt(maxDays));
                    log.debug('after adding max days', dueDate);
                    dueDate.setDate(dueDate.getDate() + parseInt(termsDaysTillNetDue));
                    log.debug('after adding ' + termsDaysTillNetDue, dueDate)
                    log.debug('test', 'duedate: ' + dueDate);
                    rrRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_kd_pymt_due_date',
                        value: dueDate
                    });
                }
            }
            rrRec.commitLine('item');
        }
        rrRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
    }
    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    };
});