/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record',  'N/url','N/currentRecord','N/search'],
/**
 * @param{record} record
 * @param{redirect} redirect
 * @param{url} url
 * @param{currentRecord} currentRecord
 * @param{search} search
 */
function(record, url,currentRecord,search) {
    var RIRSEARCH = 'customsearch606'
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

    }
    function createItemRequested(){

        var objRecord = currentRecord.get();
        var lineCount = objRecord.getLineCount({
            sublistId: 'custpage_sublistid'
        });

        var form222Id = objRecord.getValue('custpage_form222')
        var returnRequestId = objRecord.getValue('custpage_return_request')
        var mrrIdSearch = search.lookupFields({
            type: 'customsale_kod_returnrequest',
            id: returnRequestId,
            columns: ['custbody_kd_master_return_id']
        });
        var mrrId = mrrIdSearch.custbody_kd_master_return_id
        var mrrIdValue = mrrId[0].value
        var rirSearch = search.load({
            id: RIRSEARCH
        })
        var rirCount = 0;
        if(form222Id) {
            rirSearch.filters.push(search.createFilter({
                name: 'custrecord_kd_rir_form222_ref',
                operator: 'anyof',
                values: form222Id
            }));
            rirCount = rirSearch.runPaged().count;
        }
        console.log('RirCount' + rirCount)
        var totalLineCount = rirCount + lineCount;
        if(totalLineCount <= 20){
           alert('Creating Item Requested Record')
            for (var x = 0; x < lineCount; x++) {

                    if(x == lineCount - 1){
                        alert('Click Leave button to proceed on creation.')
                        window.close()
                    }

                    console.log('mrrIdValue', mrrIdValue)
                    var rir = record.create({
                        type: 'customrecord_kod_mr_item_request',
                        isDynamic: false
                    });

                    var item = objRecord.getSublistValue({
                        sublistId: 'custpage_sublistid',
                        fieldId: 'itemlist',
                        line: x
                    });
                    // var lineId = objRecord.getSublistValue({
                    //     sublistId: 'custpage_sublistid',
                    //     fieldId: 'lineid',
                    //     line: x
                    // });
                    var quantity = objRecord.getSublistValue({
                        sublistId: 'custpage_sublistid',
                        fieldId: 'qtyfieldid',
                        line: x
                    });
                    console.log('quantity ', quantity)
                    var lotnumber = objRecord.getSublistValue({
                        sublistId: 'custpage_sublistid',
                        fieldId: 'lotnumber',
                        line: x
                    });
                    console.log('Lot Number ', lotnumber)
                    var expirationdate = objRecord.getSublistValue({
                        sublistId: 'custpage_sublistid',
                        fieldId: 'expirationdate',
                        line: x
                    });
                    var expdate = new Date(expirationdate)
                     console.log('expiration date  ', expdate)
                    var fullpartial = objRecord.getSublistValue({
                        sublistId: 'custpage_sublistid',
                        fieldId: 'fullpartial',
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
                    console.log('return item requested ID', rrId)
                    if(rrId) {
                        var retreq = record.load({
                            type: 'customrecord_kod_mr_item_request',
                            id: rrId,
                            isDynamic: true
                        })
                        log.audit('ret req', retreq)
                        if (retreq) {
                            if(form222Id){
                                retreq.setValue({
                                    fieldId: 'custrecord_kd_rir_form222_ref',
                                    value: form222Id
                                })
                            }


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
                            console.log('RIR UPDATED ID', rirId)

                        }
                    }


            }

        }
        else{
            var totalExceededLines = totalLineCount - 20
            alert('You have exceeded ' + totalExceededLines + ' lines. You are only allowed to enter 20 return item requested per form 222')
        }
    }
    function validateLine(context){
        var currentRecord = context.currentRecord;
        var item = currentRecord.getCurrentSublistValue({
            sublistId: 'custpage_sublistid',
            fieldId: 'itemlist',
        })
        console.log('item ' + item)
        var rsLookUp = search.lookupFields({
                                 type: 'lotnumberedinventoryitem' ,
                                 id: item,
                                 columns: ['custitem_kod_itemcontrol']
                             });
        var category = rsLookUp.custitem_kod_itemcontrol[0].value;
        console.log(category)
        if(category != 3){
            alert('Please enter category 2 item only')
            return false
        }
        return true
    }
    function createMultipleRir(id,masterReturn) {

        //  var rslookup = search.lookupFields({
        //                          type:'customrecord_kd_222formrefnum' ,
        //                          id: id,
        //                          columns: ['custrecord_kd_returnrequest']
        //                      });
        // var returnRequestId = rslookup.custrecord_kd_returnrequest
        // var rrIdValue = returnRequestId[0].value
        // var form222id = id

        var stSuiteletUrl = url.resolveScript({
            scriptId: 'customscript_kd_sl_rir_creation',
            deploymentId: 'customdeploy_kd_sl_rir_creation',
        });
        stSuiteletUrl = stSuiteletUrl + '&returnRequestId=' +id +'&masterReturnId=' +masterReturn;
        window.open(stSuiteletUrl,'Return Item Requested', 'width=1400,height=900');
        return;

    }

        function showMessageItemProcessed() {
                location.reload()
                var infoMessage = message.create({
                    title: 'INFORMATION',
                    message: 'Creating Item Processed Record',
                    type: message.Type.INFORMATION,

                });
                infoMessage.show()


    }
    return {
        pageInit: pageInit,
        validateLine: validateLine,
        createItemRequested : createItemRequested,
        createMultipleRir: createMultipleRir,
        showMessageItemProcessed : showMessageItemProcessed
    };
    
});
