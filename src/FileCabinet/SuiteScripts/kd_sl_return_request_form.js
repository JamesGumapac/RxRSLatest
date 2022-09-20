/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(['N/record', 'N/search', 'N/ui/message', 'N/ui/serverWidget', 'N/url', 'N/ui/dialog', 'N/email', 'N/runtime'],
    /**
     * @param {record} record
     * @param {redirect} redirect
     * @param {search} search
     * @param {message} message
     * @param {serverWidget} serverWidget
     * @param {url} url
     * @param {dialog} dialog
     */
    function (record, search, message, widget, url, dialog, email, runtime) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            // function checkIfRefresh() {
            //     var request = context.request;
            //     var method = request.method;
            //     var write = "";
            //     var requestheaders = request.headers;
            //
            //     var CacheControl = requestheaders['cache-control'];
            //
            //     if (CacheControl) {
            //         if (CacheControl.indexOf('max-age=0') >= 0)
            //             write += 'refresh';
            //     }
            //
            //     log.debug(write)
            //     return write;
            // }

            function createForm(rrId) {
                var title = 'RETURN REQUEST'
                if (rrId) {
                    title = 'RETURN REQUEST HAS BEEN SUCCESSFULLY CREATED!'
                }
                var form = widget.createForm({
                    title: title
                })

                form.clientScriptFileId = 4529;
                var customer = form.addField({
                    id: 'custpage_customer',
                    label: 'customer',
                    type: widget.FieldType.SELECT,
                    source: 'customer'
                })
                customer.isMandatory = true;

                // var location = form.addField({
                //     id: 'custpage_location',
                //     label: 'location',
                //     type: widget.FieldType.SELECT,
                //     source: 'location'
                // })
                // location.isMandatory = true;

                var memo = form.addField({
                    id: 'custpage_memo',
                    label: 'NOTES',
                    type: widget.FieldType.TEXT
                })

                var sublist = form.addSublist({
                    id: 'custpage_sublistid',
                    type: widget.SublistType.INLINEEDITOR,
                    label: 'Item'
                })


                // sublist.addField({
                //     id: 'itemlist',
                //     type: widget.FieldType.SELECT,
                //     label: 'Item',
                //     source: 'item'
                // }).isMandatory = true;


                var itemSub = sublist.addField({
                    id: 'itemlist',
                    type: widget.FieldType.SELECT,
                    label: 'Item'
                })
                itemSub.isMandatory = true;
                itemSub.addSelectOption({
                    value: "",
                    text: ""
                })
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["islotitem","is","T"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                });
                var searchResultCount = itemSearchObj.runPaged().count;
                log.debug("itemSearchObj result count",searchResultCount);
                itemSearchObj.run().each(function(result){
                    var internalId = result.id;
                    var name = result.getValue({
                        name : 'itemid'
                    });

                    itemSub.addSelectOption({
                        value: internalId,
                        text: name
                    })
                    return true;

                });


                sublist.addField({
                    id: 'qtyfieldid',
                    type: widget.FieldType.INTEGER,
                    label: 'Quantity(TOTAL)'
                }).isMandatory = true

                sublist.addField({
                    id: 'lotnumber',
                    type: widget.FieldType.TEXT,
                    label: 'LOT NUMBER'
                }).isMandatory = true;

                sublist.addField({
                    id: 'expirationdate',
                    type: widget.FieldType.DATE,
                    label: 'EXPIRATION DATE'
                }).isMandatory = true;

                var _fullpartial = sublist.addField({
                    id: 'fullpartial',
                    type: widget.FieldType.SELECT,
                    label: 'FULL/PARTIAL PACKAGE'
                });
                _fullpartial.addSelectOption({
                    value: '',
                    text: ''
                })

                _fullpartial.addSelectOption({
                    value: '1',
                    text: 'Full Package'
                });

                _fullpartial.addSelectOption({
                    value: '2',
                    text: 'Partial Package'
                })


                form.addSubmitButton({
                    label: 'Sumbit Return Request'
                });
                form.addResetButton({
                    label: ' Reset '
                })

                return form;
            }

            if (context.request.method == 'GET') {

                context.response.writePage(createForm())
            } else if (context.request.method === 'POST') {
              // var refresh = checkIfRefresh();

              // log.debug('Refresh ' , refresh)

               // if(refresh == 'refresh'){

                    var req = context.request;
                    var customer = req.parameters.custpage_customer
                   // var location = req.parameters.custpage_location
                    var memo = req.parameters.custpage_memo
                    var lineCount = req.getLineCount({
                        group: 'custpage_sublistid'
                    });

                    function _setSublistValue(objRec, sublistId, fieldId, line, value) {
                        return objRec.setSublistValue({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            line: line,
                            value: value
                        });
                    }

                    log.debug('customer', customer)
                   // log.debug('location ', location)
                    log.debug('memo ', memo)
                    log.debug('lineCount ', lineCount)

                    var retreq = record.create({
                        type: 'customsale_kod_returnrequest',
                        isDynamic: false
                    });
                    retreq.setValue({
                        fieldId: 'entity',
                        value: customer
                    })
                    retreq.setValue({
                        fieldId: 'location',
                        value: 1
                    })
                    retreq.setValue({
                        fieldId: 'memo',
                        value: memo
                    })

                    for (var x = 0; x < lineCount; x++) {
                        var item = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'itemlist',
                            line: x
                        });
                        log.debug('item  line ', x)
                        log.debug('item ', item)
                        var quantity = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'qtyfieldid',
                            line: x
                        });
                        log.debug('quantity ', quantity)
                        var lotnumber = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'lotnumber',
                            line: x
                        });
                        log.debug('Lot Number ', lotnumber)
                        var expirationdate = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'expirationdate',
                            line: x
                        });
                        var expdate = new Date(expirationdate)
                        log.debug('expiration date  ', expdate)
                        var fullpartial = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'fullpartial',
                            line: x
                        });
                        log.debug('fullpartial ', fullpartial)

                        var fieldLookUp = search.lookupFields({
                            type: search.Type.ITEM,
                            id: item, //pass the id of the item here
                            columns: 'islotitem'
                        });
                        log.debug('Field Lookup', fieldLookUp)


                        var lookup = fieldLookUp.islotitem;
                        log.debug('Is lot Item', 'TRUE')
                        if (lookup === true) {

                            _setSublistValue(retreq, 'item', 'item', x, item);
                            _setSublistValue(retreq, 'item', 'custcol_kod_fullpartial', x, fullpartial);
                            _setSublistValue(retreq, 'item', 'quantity', x, quantity);
                            _setSublistValue(retreq, 'item', 'amount', x, 0);
                            var subrec = retreq.getSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: x
                            });
                            log.debug('subrec ', subrec)
                            if (subrec) {
                                log.debug('Setting Inventory details for item ', item)

                                log.debug('Setting Sublist Value receiptinventorynumber line 225')
                                subrec.setSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    line: 0,
                                    value: lotnumber
                                });


                                subrec.setSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    line: 0,
                                    value: quantity
                                });
                                subrec.setSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'expirationdate',
                                    line: 0,
                                    value: expdate
                                });

                            }


                        } else {
                            log.debug('Entering Else line 260')
                            _setSublistValue(retreq, 'item', 'item', x, item);
                            _setSublistValue(retreq, 'item', 'custcol_kod_fullpartial', x, fullpartial);
                            _setSublistValue(retreq, 'item', 'quantity', x, quantity);
                            _setSublistValue(retreq, 'item', 'amount', x, 0);
                        }


                    }

                    var rrId = retreq.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    var tranidLookup = search.lookupFields({
                        type: 'customsale_kod_returnrequest',
                        id: rrId, //pass the id of the item here
                        columns: 'tranid'
                    });
                    var tranId = tranidLookup.tranid
                    log.debug('Create Return Request', 'RR ID: ' + rrId)
                    log.debug('RR Document No. ', tranId)
                    if(tranId){
                        context.response.writePage(createForm(tranId))
                    }


               // }
                // else{
                //     context.response.write('Invalid Operation')
                // }


            }
        }

        return {
            onRequest: onRequest
        };

    }
);
