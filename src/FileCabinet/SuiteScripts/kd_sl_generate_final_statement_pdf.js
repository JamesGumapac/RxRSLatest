/**
*@NApiVersion 2.x
*@NScriptType Suitelet
* 
*/
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/redirect', 'N/format', 'N/email'],
function(render, record, file, search, redirect, format, email){
    var SEARCH_MRR_RIP_SUMMARY = 'customsearch_kd_mrr_rip_summary';
    var SEARCH_MRR_RIP = 'customsearch_kd_mrr_rtn_items_processed';
    var SEARCH_MRR_TRAN_TOTALS = 'customsearch_kd_mrr_cm_total_amount';
    var SEARCH_MRR_PAYMENTS = 'customsearch_kd_mrr_payments';
    var REC_MRR = 'customrecord_kod_masterreturn';
    var PHAR_PRCSG_RETURNABLE = 1;
    var PHAR_PRCSG_NON_RETURNABLE = 2;
    var RIP_FLD_MANUFACTURER = 'custrecord_kd_rir_manufacturer';
    var RIP_FLD_PHAR_PROCESSING = 'custrecord_kd_pharma_proc';
    var RIP_FLD_RATE = 'custrecord_kd_rate';
    var RIP_FLD_AMOUNT = 'custrecord_kd_amount_charge';
    var RIP_FLD_ITEM_NDC = 'custitem_kod_item_ndc';
    var RIP_FLD_ITEM_PK_SIZE = 'custitem_kod_packsize';
    var RIP_FLD_ITEM_CONTROL = 'custitem_kod_itemcontrol';
    var RIP_FLD_ITEM_DISPLAY = 'displayname';
    var RIP_FLD_LOT_NUM = 'custrecord_kd_lotnumber';
    var RIP_FLD_LOT_EXP = 'custrecord_kd_lot_expiration';
    var RIP_FLD_INVOICE = 'custrecord_kd_invoice_link';
    var FLD_TRAN_MRR = 'custbody_kd_cm_master_return_id';
    
    //ndc, item, lotnum, expdate, pkSize, fullQty, partialQty, rate;

    //var CATEG_RX_OTC = "1";
    //var CATEG_C2 = "3";
    //var CATEG_C3_5 = "4";
    var mrr_id;//check if needed
    var mrrInvoices = [];
    function getItemsProcessedSummary(mrrId){
        var ripSearch = search.load(SEARCH_MRR_RIP_SUMMARY);
        ripSearch.filters.push(search.createFilter({
            name: 'custrecord_master_return_id',
            operator: search.Operator.IS,
            values: mrrId
        }));

        var start = 0; end = 1000;
        var searchRs = ripSearch.run();
        var rs = searchRs.getRange(start, end);
        var manufacturer, pharProcessing, amount;
        var returnables = [], nonReturnables = [];
        var returnablesSubtotal = 0, nonReturnablesSubtotal = 0;
        do{
            for(var i = 0; i < rs.length; i++){
                manufacturer = rs[i].getText({
                    name: RIP_FLD_MANUFACTURER,
                    summary: search.Summary.GROUP
                });

                pharProcessing = rs[i].getValue({
                    name: RIP_FLD_PHAR_PROCESSING,
                    summary: search.Summary.GROUP
                });

                amount = rs[i].getValue({
                    name: RIP_FLD_AMOUNT,
                    summary: search.Summary.SUM
                });

                if(pharProcessing == PHAR_PRCSG_RETURNABLE){
                    returnables.push({
                        manufacturer: manufacturer,
                        amount: amount
                    });
                    returnablesSubtotal += parseFloat(amount);
                }else{
                    nonReturnables.push({
                        manufacturer: manufacturer,
                        amount: amount
                    });
                    nonReturnablesSubtotal += parseFloat(amount);
                }
            }
            start += 1000;
            end += 1000;
            rs = searchRs.getRange(start, end);
            log.debug('test', 'rs length: ' + rs.length)
        }while(rs.length > 0)

        return {
            returnables: returnables, 
            returnablesSubtotal: returnablesSubtotal, 
            nonReturnables: nonReturnables, 
            nonReturnablesSubtotal: nonReturnablesSubtotal,
            total: parseFloat(returnablesSubtotal) + parseFloat(nonReturnablesSubtotal)
        };
    }
    function getItemsProcessed(mrrId){
        var ripSearch = search.load(SEARCH_MRR_RIP);
        ripSearch.filters.push(search.createFilter({
            name: 'custrecord_master_return_id',
            operator: search.Operator.IS,
            values: mrrId
        }));

        var start = 0; end = 1000;
        var searchRs = ripSearch.run();
        var rs = searchRs.getRange(start, end);
        var manufacturer, manufacturerName, pharProcessing, amount, ndc, item, lotNum, expDate, pkSize, fullQty, partialQty, rate, controlType, invoice;
        var returnables = [], nonReturnables = [];
        var returnableManufs = [], nonReturnableManufs = [];
        var returnablesSubtotal = 0, nonReturnablesSubtotal = 0;
        var indx;
        do{
          log.debug('TEST', 'items processed count: ' + rs.length);
            for(var i = 0; i < rs.length; i++){
                manufacturer = rs[i].getValue({
                    name: RIP_FLD_MANUFACTURER
                });

                manufacturerName = rs[i].getText({
                    name: RIP_FLD_MANUFACTURER
                });

                pharProcessing = rs[i].getValue({
                    name: RIP_FLD_PHAR_PROCESSING
                });

                rate = rs[i].getValue({
                    name: RIP_FLD_RATE
                });

                amount = rs[i].getValue({
                    name: RIP_FLD_AMOUNT
                });

                ndc = rs[i].getValue({
                    name: RIP_FLD_ITEM_NDC,
                    join: 'CUSTRECORD_KOD_ITEM_PROCESSED'
                });

                item = rs[i].getValue({
                    name: RIP_FLD_ITEM_DISPLAY,
                    join: 'CUSTRECORD_KOD_ITEM_PROCESSED'
                });

                pkSize = rs[i].getValue({
                    name: RIP_FLD_ITEM_PK_SIZE,
                    join: 'CUSTRECORD_KOD_ITEM_PROCESSED'
                });

                lotNum = rs[i].getValue({
                    name: RIP_FLD_LOT_NUM
                });

                expDate = rs[i].getValue({
                    name: RIP_FLD_LOT_EXP
                });

                controlType = rs[i].getText({
                    name: RIP_FLD_ITEM_CONTROL,
                    join: 'CUSTRECORD_KOD_ITEM_PROCESSED'
                });

                invoice = rs[i].getValue({
                    name: RIP_FLD_INVOICE
                });

                if(mrrInvoices.indexOf(invoice) < 0){
                    mrrInvoices.push(invoice);
                }

                fullQty = rs[i].getValue(rs[i].columns[6]);
                partialQty = rs[i].getValue(rs[i].columns[7]);
                log.debug('phar processing', pharProcessing);
                if(pharProcessing == PHAR_PRCSG_RETURNABLE){
                    if(returnableManufs.indexOf(manufacturer) < 0){
                        returnableManufs.push(manufacturer);
                        returnables.push({
                            manufacturer: manufacturerName,
                            items: []
                        });
                    }
                    indx = returnableManufs.indexOf(manufacturer);
                    log.debug('getItemsProcessed returnable', 'index: ' + indx);
                    returnables[indx].items.push({
                        item: item,
                        ndc: ndc,
                        lotnum: lotNum,
                        expdate: expDate,
                        full: fullQty,
                        partial: partialQty,
                        rate: rate,
                        amount: amount,
                        pksize: pkSize,
                        control: controlType
                    });
                    returnablesSubtotal += parseFloat(amount);
                }else{
                    if(nonReturnableManufs.indexOf(manufacturer) < 0){
                        nonReturnableManufs.push(manufacturer);
                        nonReturnables.push({
                            manufacturer: manufacturerName,
                            items: []
                        });
                    }
                    indx = nonReturnableManufs.indexOf(manufacturer);
                    log.debug('getItemsProcessed non-returnable', 'index: ' + indx);
                    nonReturnables[indx].items.push({
                        item: item,
                        ndc: ndc,
                        lotnum: lotNum,
                        expdate: expDate,
                        full: fullQty,
                        partial: partialQty,
                        rate: rate,
                        amount: amount,
                        pksize: pkSize,
                        control: controlType
                    });
                    nonReturnablesSubtotal += parseFloat(amount);
                }
            }
            start += 1000;
            end += 1000;
            rs = searchRs.getRange(start, end);
            log.debug('test', 'rs length: ' + rs.length)
        }while(rs.length > 0)

        return {returnables: returnables, returnablesSubtotal: returnablesSubtotal, nonReturnables: nonReturnables, nonReturnablesSubtotal: nonReturnablesSubtotal};
    }
    function getTransactionsTotal(mrrId){
        try{
            var mrrTranTotalsSearch = search.load(SEARCH_MRR_TRAN_TOTALS);
            mrrTranTotalsSearch.filters.push(search.createFilter({
                name: FLD_TRAN_MRR,
                operator: search.Operator.IS,
                values: mrrId
            }));

            var start = 0; end = 1000;
            var searchRs = mrrTranTotalsSearch.run();
            var rs = searchRs.getRange(start, end);
            var tranTotals = {};
            var tranType, tranTotal, invcTotal = 0, cmTotal = 0;
            for(var i = 0; i < rs.length; i++){
                tranType = rs[i].getValue({
                    name: 'type',
                    summary: search.Summary.GROUP
                });

                tranTotal = rs[i].getValue({
                    name: 'total',
                    summary: search.Summary.SUM
                });

                if(tranType.toLowerCase() == 'custinvc'){
                    invcTotal = parseFloat(invcTotal) + parseFloat(tranTotal);
                }else if(tranType.toLowerCase() == 'custcred'){
                    cmTotal = (parseFloat(cmTotal) + parseFloat(tranTotal)) * parseFloat(-1);
                }
            }

            return {'creditmemo': format.format({value: cmTotal, type: format.Type.CURRENCY}), 'invoice': format.format({value: invcTotal, type: format.Type.CURRENCY})};
        }catch(ex){
            log.error('getTransactionsTotal', ex.message);
        }
    }
    function getRecordFields(mrrId){
        try{
            var lookupRs = search.lookupFields({
                type: REC_MRR,
                id:  mrrId,
                columns: ['name', 'custrecord_kod_mr_requestdt', 'custrecord_kod_customer', 'custrecord_kod_customer.billaddress']
            });

            log.debug('getRecordFields', JSON.stringify(lookupRs));
            var mrrName = lookupRs.name;
            var reqDate = lookupRs.custrecord_kod_mr_requestdt;
            var customer = lookupRs.custrecord_kod_customer[0].text;
            var billAddr = lookupRs['custrecord_kod_customer.billaddress'];
            //lookupRs.custbody_kd_master_return_id[0].text;
            //mrr_id = lookupRs.custbody_kd_master_return_id[0].value;

            return {name: mrrName, requestdate: reqDate, customer: customer, billaddr: billAddr};
        }catch(ex){
            log.error('getRecordFields', ex.message);
        }
    }
    function getPayments(){
        log.debug('test1', JSON.stringify(mrrInvoices));
        try{
            var mrrPayments = [];
            if(mrrInvoices.length > 0 && mrrInvoices[0] != ''){
                var mrrPaymentsSearch = search.load(SEARCH_MRR_PAYMENTS);
                mrrPaymentsSearch.filters.push(search.createFilter({
                    name: 'appliedtotransaction',
                    operator: search.Operator.ANYOF,
                    values: mrrInvoices
                }));

                var start = 0; end = 1000;
                var searchRs = mrrPaymentsSearch.run();
                var rs = searchRs.getRange(start, end);
                var tranId, amount, tranDate;
                for(var i = 0; i < rs.length; i++){
                    tranId = rs[i].getValue({
                        name: 'tranid'
                    });

                    amount = rs[i].getValue({
                        name: 'appliedtolinkamount'
                    });

                    tranDate = rs[i].getValue({
                        name: 'trandate'
                    });

                    mrrPayments.push({
                        tranid: tranId,
                        amount: format.format({value: amount, type: format.Type.CURRENCY}),
                        date: tranDate
                    });

                    /*mrrPayments.push({
                        tranid: tranId,
                        amount: format.format({value: amount, type: format.Type.CURRENCY}),
                        date: tranDate
                    });*/
                }
                log.debug('test2', JSON.stringify({payments: mrrPayments}));
            }
            return {payments: mrrPayments};
        }catch(ex){
            log.error('getPayments', ex.message);
        }
        
        //"appliedtotransaction"  customsearch_kd_mrr_payments
    }
    function getMrrFolder(id){
        log.debug('getMrrFolder', id);
        var lookupRs = search.lookupFields({
            type: 'customrecord_kod_masterreturn',
            id:  id,
            columns: ['name']
        }); 
        
        log.debug('getMrrFolder', JSON.stringify(lookupRs) + ' : ' + lookupRs.name);
        var mrrName = lookupRs.name;
        //mrr_id = lookupRs.custbody_kd_master_return_id[0].value;

        var folderId = search.create({
            type: 'folder',
            filters: [
              ['name', 'is', mrrName]
            ]
        }).run().getRange({ start: 0, end: 1 });

        return folderId[0].id;//customerFolderId;
    }
    function generatePdf(context){
        try{
            var response = context.response;
            var request = context.request;
            log.debug('generatePdf PARAM', request.parameters.custscript_kd_mrr_id);
            var id = request.parameters.custscript_kd_mrr_id;
            //log.debug('generatePdf', 'calling get mrr folder id');
            //var mrrFolderId = getMrrFolder(id);
            //log.debug('generatePdf', 'mrr folder id ' + mrrFolderId);
            
            if(!id) {
                response.write('id parameter missing');
            }

            var itemsProcessedSummary = getItemsProcessedSummary(id);
            var itemsProcessed = getItemsProcessed(id);
            var tranTotals = getTransactionsTotal(id);
            var recordFields = getRecordFields(id);
            var payments = getPayments();
            var renderer = render.create();
            var template = file.load({
                id: 'SuiteScripts/kd_rxrs_finalstatement_pdfhtml_tmplt.xml'
            });
            renderer.templateContent = template.getContents();
            /*renderer.addSearchResults({
                templateName: 'results',
                searchResult: itemsRequested
            });*/
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "items_summary",
                data: itemsProcessedSummary
            });
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "items_processed",
                data: itemsProcessed
            });
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "tran_totals",
                data: tranTotals
            });
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "payments",
                data: payments
            });
            /*renderer.addRecord({
    			templateName: 'record',
                record: record.load({
                    type: 'customrecord_kod_masterreturn',
                    id: id
                })
            });*/
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "record",
                data: recordFields
            });
            log.debug('test', 'OBJECT IS SET');
            var xml = renderer.renderAsString();
            var finalStatementPdf = renderer.renderAsPdf();
            finalStatementPdf.name = recordFields.name + ' Final Statement';
            finalStatementPdf.folder = getMrrFolder(id);
            var fid = finalStatementPdf.save();
            log.debug('test', 'file id: ' + fid);
            var attachitem = record.attach({
                record: { type: 'file', id: fid },
                to: { type: 'customrecord_kod_masterreturn', id: id }
            });

            var lookupRs = search.lookupFields({
                type: REC_MRR,
                id:  id,
                columns: ['custrecord_kod_customer']
            });

            log.debug('getting customer', JSON.stringify(lookupRs));
            email.send({
                author: 9,//runtime.getCurrentUser(),
                recipients: lookupRs.custrecord_kod_customer[0].value,
                subject: recordFields.name + ' Final Statement',
                body: 'Attached is the ' + recordFields.name + ' Final Statement',
                attachments: [finalStatementPdf]/*,
                relatedRecords: {
                       entityId: recipientId,
                        customRecord:{
                              id:recordId,
                              recordType: recordTypeId //an integer value
                              }
                  }*/
            });
            log.debug('ATTACHING', REC_MRR + ' ' + id + '; file: custrecord_kd_mrr_final_statement ' + fid);
            record.submitFields({
                type: REC_MRR,
                id: id,
                values: {
                    'custrecord_kd_mrr_final_statement': fid,
                    'custrecord_kod_mr_status': 10
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });

            redirect.toRecord({
                type: REC_MRR,
                id: id
            });
        }catch(exc){
            log.error('ERR', 'generatePdf: ' + exc.toString());
        }
    }
    function getReturnItemsRequested(mrrId){
        var rxOtcItems = [];
        var c35Items = [];
        var c2Items = [];
        var rirSearch = search.load(SEARCH_MRR_RIR);
        rirSearch.filters.push(search.createFilter({
            name: 'custrecord_kd_rir_masterid',
            operator: search.Operator.IS,
            values: mrrId
        }));
        //log.debug('test', rirSearch.run().getRange(0,1000).length);
        var returnItemRequests = [];
        var itemDetails = {};
        var start = 0; end = 1000;
        var searchRs = rirSearch.run();
        var rs = searchRs.getRange(start, end);

        do{
            for(var i = 0; i < rs.length; i++){
                var displayName = rs[i].getValue({
                    name: 'displayname',
                    join: 'CUSTRECORD_KD_RIR_ITEM'
                });
                var ndc = rs[i].getValue({
                    name: 'custitem_kod_item_ndc',
                    join: 'CUSTRECORD_KD_RIR_ITEM'
                });
                var lotNumber = rs[i].getValue({
                    name: 'custrecord_kd_rir_lotnumber',
                });
                var lotExp = rs[i].getValue({
                    name: 'custrecord_kd_rir_lotexp',
                });
                var fullQty = rs[i].getValue(rs[i].columns[6]);
                var partialQty = rs[i].getValue(rs[i].columns[7]);
                var category = rs[i].getValue({
                    name: 'custrecord_kd_rir_category'
                });

                itemDetails = {
                    displayname: displayName,
                    ndc: ndc,
                    lotnumber: lotNumber,
                    lotexp: lotExp,
                    fullqty: fullQty,
                    partialQty: partialQty/*,
                    category: category*/
                }

                if(category == CATEG_C2){
                    log.debug('test', 'added to c2');
                    c2Items.push(itemDetails);
                }else if(category == CATEG_C3_5){
                    log.debug('test', 'added to c35');
                    c35Items.push(itemDetails);
                }else if(category == CATEG_RX_OTC){
                    log.debug('test', 'added to rxotc');
                    rxOtcItems.push(itemDetails);
                }
            }
            start += 1000;
            end += 1000;
            rs = searchRs.getRange(start, end);
            log.debug('test', 'rs length: ' + rs.length)
        }while(rs.length > 0)

        return {rxOtcItems: rxOtcItems, c35Items: c35Items, c2Items: c2Items};
    }
    /*function getMrrFolder(id){
        var lookupRs = search.lookupFields({
            type: 'customsale_kod_returnrequest',
            id:  id,
            columns: ['custbody_kd_master_return_id']
        }); 
        
        log.debug('getMrrFolder', JSON.stringify(lookupRs) + ' : ' + lookupRs.custbody_kd_master_return_id[0].text);
        var mrrName = lookupRs.custbody_kd_master_return_id[0].text;
        mrr_id = lookupRs.custbody_kd_master_return_id[0].value;

        var folderId = search.create({
            type: 'folder',
            filters: [
              ['name', 'is', mrrName]
            ]
        }).run().getRange({ start: 0, end: 1 });

        return folderId[0].id;
    }*/
    function generatePdfRIR(context){
        try{
            var response = context.response;
            var request = context.request;
            log.debug('test', request.parameters.id);
            var id = request.parameters.id;
            if(!id) {
                response.write('id parameter missing');
            }

            var itemsRequested = getReturnItemsRequested(id);
            log.debug('generatePdf', 'C2: ' + JSON.stringify(itemsRequested.c2Items));
            log.debug('generatePdf', 'C35: ' + JSON.stringify(itemsRequested.c35Items));
            log.debug('generatePdf', 'RXOTC: ' + JSON.stringify(itemsRequested.rxOtcItems));

            var renderer = render.create();
            var template = file.load({
                id: 'SuiteScripts/kd_rxrs_itemsrequested_pdfhtml_tmplt.xml'
            });
            renderer.templateContent = template.getContents();
            /*renderer.addSearchResults({
                templateName: 'results',
                searchResult: itemsRequested
            });*/
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "itemsrequested",
                data: itemsRequested
            });
            renderer.addRecord('record', context.newRecord);
            log.debug('test', 'OBJECT IS SET');
            var xml = renderer.renderAsString();
            log.debug('test', 'xml: ' + xml);
            //var pdf = render.xmlToPdf(xml);
            log.debug('test', '2');
            //var pdf = renderer.renderAsPdf();
            log.debug('test', '3');
            //response.setContentType('PDF', 'Print.pdf ', 'inline');
            log.debug('test', '4');
            // write response to the client
            //response.write(pdf.getValue());
            response.renderPdf({xmlString: xml});
            /*pdf.folder = getMrrFolder(id);//config.getValue({fieldId: 'custrecord_extpdf_temp_folder'});
            var lookupRs = search.lookupFields({
                type: 'customsale_kod_returnrequest',
                id:  id,
                columns: ['tranid']
            }); 
            
            log.debug('test', JSON.stringify(lookupRs) + ' : ' + lookupRs.tranid);
            pdf.name = lookupRs.tranid + '_form222.pdf';//'RR' + id + '_form222.pdf';
            var fid = pdf.save();
            log.debug('test', 'file id: ' + fid);
            var attachitem = record.attach({
                record: { type: 'file', id: fid },
                to: { type: 'customsale_kod_returnrequest', id: id }
            });*/
        }catch(exc){
            log.error('ERR', 'generatePdf: ' + exc.toString());
        }
    }
    return {
        onRequest: generatePdf
    };
});
