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
        var FORM222SEARCH = 'customsearch_kd_form222_script_search'
        function onRequest(context) {

            function createForm(rrId) {
                var title = 'RETURN ITEM REQUESTED'
                if (rrId) {
                    title = 'RETURN REQUEST HAS BEEN SUCCESSFULLY CREATED!'
                }
                var form = widget.createForm({
                    title: title
                })

                form.clientScriptFileId = 4529;

                var mrrId = context.request.parameters['masterReturnId']
                var returnRequestId = context.request.parameters['returnRequestId']
                log.debug('returnRequestId', returnRequestId)

                log.debug('mrrId', mrrId)
                var returnRequest = form.addField({
                    id: 'custpage_return_request',
                    label: 'Return Request Id',
                    type: widget.FieldType.SELECT,
                    source: 'customsale_kod_returnrequest'
                })
                var masterRequest = form.addField({
                    id: 'custpage_master_return',
                    label: 'Master Return ID',
                    type: widget.FieldType.SELECT,
                    source: 390
                })
                var form222ListSearch = search.load({
                    id: FORM222SEARCH
                })
                form222ListSearch.filters.push(search.createFilter({
                    name: 'custrecord_kd_returnrequest',
                    operator: 'anyof',
                    values: returnRequestId
                }));
                var form222 = form.addField({
                    id: 'custpage_form222',
                    label: 'Form 222 Id',
                    type: widget.FieldType.SELECT
                })
                form222.addSelectOption({
                    value: '',
                    text: ''
                })
                form222ListSearch.run().each(function (result) {
                    form222.addSelectOption({
                        value: result.id,
                        text: result.getValue({
                            name: 'name'
                        })
                    })
                    return true;
                });

                returnRequest.defaultValue = returnRequestId
                masterRequest.defaultValue = mrrId
                var sublist = form.addSublist({
                    id: 'custpage_sublistid',
                    type: widget.SublistType.INLINEEDITOR,
                    label: 'Return Item Requested'
                })


                var itemSub = sublist.addField({
                    id: 'itemlist',
                    type: widget.FieldType.SELECT,
                    label: 'Item',
                    source: 'item'
                })
                itemSub.isMandatory = true;
                // itemSub.addSelectOption({
                //     value: "",
                //     text: ""
                // })
                // var itemSearchObj = search.create({
                //     type: "item",
                //     filters:
                //         [
                //             ["islotitem", "is", "T"]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({
                //                 name: "itemid",
                //                 sort: search.Sort.ASC,
                //                 label: "Name"
                //             }),
                //             search.createColumn({name: "internalid", label: "Internal ID"})
                //         ]
                // });
                // var searchResultCount = itemSearchObj.runPaged().count;
                // log.debug("itemSearchObj result count", searchResultCount);
                // itemSearchObj.run().each(function (result) {
                //     var internalId = result.id;
                //     var name = result.getValue({
                //         name: 'itemid'
                //     });
                //
                //     itemSub.addSelectOption({
                //         value: internalId,
                //         text: name
                //     })
                //     return true;
                //
                // });

                // sublist.addField({
                //     id: 'lineid',
                //     type: widget.FieldType.INTEGER,
                //     label: 'Line ID'
                // }).isMandatory = true
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
                })
                _fullpartial.isMandatory = true;
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
                form.clientScriptFileId = 18581;
                form.addButton({
                    id: 'custpage_submit',
                    label: 'Submit',
                    functionName: 'createItemRequested()'
                });
                // form.addSubmitButton({
                //     label: 'SUBMIT ITEM REQUESTED'
                // });
                form.addResetButton({
                    label: ' Reset '
                })

                return form;
            }

            if (context.request.method == 'GET') {

                context.response.writePage(createForm())
            } else if (context.request.method === 'POST') {


                var req = context.request;

                var returnRequestId = req.parameters.custpage_return_request
                var form222 = req.parameters.custpage_form222

                var lineCount = req.getLineCount({
                    group: 'custpage_sublistid'
                });
                var mrrIdSearch = search.lookupFields({
                    type: 'customsale_kod_returnrequest',
                    id: returnRequestId,
                    columns: ['custbody_kd_master_return_id']
                });
                var mrrId = mrrIdSearch.custbody_kd_master_return_id
                var mrrIdValue = mrrId[0].value
                function _setSublistValue(objRec, sublistId, fieldId, line, value) {
                    return objRec.setSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        line: line,
                        value: value
                    });
                }


                for (var x = 0; x < lineCount; x++) {
                    try {


                        log.debug('mrrIdValue', mrrIdValue)
                        var rir = record.create({
                            type: 'customrecord_kod_mr_item_request',
                            isDynamic: false
                        });

                        var item = req.getSublistValue({
                            group: 'custpage_sublistid',
                            name: 'itemlist',
                            line: x
                        });
                        // var lineId = req.getSublistValue({
                        //     group: 'custpage_sublistid',
                        //     name: 'lineid',
                        //     line: x
                        // });
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
                        rir.setValue({
                            fieldId: 'custrecord_kd_rir_masterid',
                            value: mrrIdValue
                        })

                            rir.setValue({
                                fieldId: 'custrecord_kd_rir_return_request',
                                value: +returnRequestId

                            })
                            var rrId = rir.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                          log.debug('return item requested ID', rrId)
                            if(rrId) {
                                var retreq = record.load({
                                    type: 'customrecord_kod_mr_item_request',
                                    id: rrId,
                                    isDynamic: true
                                })
                                log.audit('ret req', retreq)
                                if (retreq) {
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_form222_ref',
                                        value: parseInt(form222)
                                    })

                                    // retreq.setValue({
                                    //     fieldId: 'custrecord_kd_rir_lineid',
                                    //     value: lineId
                                    // })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_item',
                                        value: item
                                    })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_quantity',
                                        value: quantity
                                    })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_fulpar',
                                        value: fullpartial
                                    })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_lotnumber',
                                        value: lotnumber
                                    })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_lotexp',
                                        value: expdate
                                    })
                                    retreq.setValue({
                                        fieldId: 'custrecord_kd_rir_lotexp',
                                        value: expdate
                                    })

                                    var rirId = retreq.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    log.debug('RIR UPDATED ID', rirId)
                                }
                            }
                    } catch (e) {
                        log.error(e.message)
                    }

                }
                context.response.write("<script> alert('Creating Item Requested') </script>");
                context.response.write("<script>  window.close() </script>");



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
