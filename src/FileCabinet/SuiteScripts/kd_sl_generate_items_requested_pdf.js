/**
*@NApiVersion 2.x
*@NScriptType Suitelet
* 
*/
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/redirect'],
function(render, record, file, search, redirect){
    var SEARCH_MRR_RIR = 'customsearch_kd_mrr_return_item_req';
    var CATEG_RX_OTC = "1";
    var CATEG_C2 = "3";
    var CATEG_C3_5 = "4";
    var mrr_id;//check if needed
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

        /*rirSearch.run().each(function(result){
            var displayName = result.getValue({
                name: 'displayname',
                join: 'CUSTRECORD_KD_RIR_ITEM'
            });
            var ndc = result.getValue({
                name: 'custitem_kod_item_ndc',
                join: 'CUSTRECORD_KD_RIR_ITEM'
            });
            var lotNumber = result.getValue({
                name: 'custrecord_kd_rir_lotnumber',
            });
            var lotExp = result.getValue({
                name: 'custrecord_kd_rir_lotexp',
            });
            var fullQty = result.getValue(result.columns[6]);
            var partialQty = result.getValue(result.columns[7]);
            var category = result.getValue({
                name: 'custrecord_kd_rir_category'
            });

            itemDetails = {
                displayname: displayName,
                ndc: ndc,
                lotnumber: lotNumber,
                lotexp: lotExp,
                fullqty: fullQty,
                partialQty: partialQty,
                category: category
            }
            log.debug('TEST', 'items: ' + itemDetails)
            switch(category){
                case CATEG_C2:
                    log.debug('test', 'added to c2');
                    c2Items.push(itemDetails);
                    break;
                case CATEG_C3_5:
                    log.debug('test', 'added to c35');
                    c35Items.push(itemDetails);
                    break;
                case CATEG_RX_OTC:
                    log.debug('test', 'added to rxotc');
                    rxOtcItems.push(itemDetails);
                    break;
            }

            returnItemRequests.push({
                displayname: displayName,
                ndc: ndc,
                lotnumber: lotNumber,
                lotexp: lotExp,
                fullqty: fullQty,
                partialQty: partialQty,
                category: category
            });
        });*/

        //return returnItemRequests;
        return {rxOtcItems: rxOtcItems, c35Items: c35Items, c2Items: c2Items};
    }
    function getMrrFolder(id){
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
              ['name', 'is', mrrName]/*, 
              'and', 
              ['parent', 'anyof', [PARENT_FOLDER_ID]]*/
            ]
        }).run().getRange({ start: 0, end: 1 });

        return folderId[0].id;//customerFolderId;
    }
    function generatePdf(context){
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
            renderer.addRecord({
    			templateName: 'record',
                record: record.load({
                    type: 'customrecord_kod_masterreturn',
                    id: id
                })
            });
            log.debug('test', 'OBJECT IS SET');
            var xml = renderer.renderAsString();
            //response.write(pdf.getValue());
            response.renderPdf({xmlString: xml});
        }catch(exc){
            log.error('ERR', 'generatePdf: ' + exc.toString());
        }
    }
    function generatePdfOLD(context){
        try{
            var response = context.response;
            var request = context.request;
            log.debug('test', request.parameters.id);
            try {
				var id = request.parameters.id;
                if(!id) {
                    response.write('id parameter missing');
                }
        
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: id
                });
                var renderer = render.create();
                var template = file.load({
                    id: 'SuiteScripts/kd_rxrs_form222_pdfhtml_tmplt.xml'
                });
                
              	renderer.templateContent = template.getContents();
                renderer.addRecord('record', rrRec);
                var xml = renderer.renderAsString();
                var pdf = render.xmlToPdf(xml);
                var pdf = renderer.renderAsPdf();
                pdf.folder = getMrrFolder(id);//config.getValue({fieldId: 'custrecord_extpdf_temp_folder'});
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
                });

                /*var lookupRs = search.lookupFields({
                    type: 'customsale_kod_returnrequest',
                    id:  id,
                    columns: ['memo']
                }); 
                
                log.debug('test', JSON.stringify(lookupRs) + ' : ' + lookupRs.memo);
                var memo = lookupRs.memo;*/

                record.submitFields({
                    type: 'customsale_kod_returnrequest',
                    id: id,
                    values: {
                        'transtatus': 'D'
                    }
                });
              	
    			log.debug('TEST', 'attached file ' + fid + ' to rr ' + id);
              	redirect.toRecord({
                    type: 'customsale_kod_returnrequest',
                    id: id
                });
                //response.setContentType('PDF', 'itemlabel.pdf', 'inline');
                //response.writePage(pdf);
            } catch(err) {
                log.debug('DEBUG', err.message);
                response.write(err + ' (line number: ' + err.lineno + ')');
                return;
            }
        }catch(exception){
            log.debug('DEBUG', 'Error in generatePdf: ' + exception);
        }
    }
    function generatePdfOLD(context){
        try{
            var response = context.response;
            log.debug('test', context.request.parameters.id);
            try {

                var id = context.request.parameters.id;
                if(!id) {
                    response.write('id parameter missing');
                }
        
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: id
                });
                var renderer = render.create();
                var template = file.load({
                    id: 'SuiteScripts/kd_rxrs_form222_pdfhtml_tmplt.xml'
                });
                log.debug('test', 1)
                //renderer.setTemplateById('STDTMP0000LTEST');//template.getContents());
                renderer.templateContent = template.getContents();
                log.debug('test', 2)
                renderer.addRecord('record', rrRec);
                log.debug('test', 3)
                var xml = renderer.renderAsString();
                log.debug('test', 4)
                var pdf = render.xmlToPdf(xml);
                var pdf = renderer.renderAsPdf();
                pdf.folder = getMrrFolder(id);//config.getValue({fieldId: 'custrecord_extpdf_temp_folder'});
                pdf.name = 'MRR' + id + '_form222.pdf';
                var fid = pdf.save();
                var attachitem = record.attach({
                    record: { type: 'file', id: fid },
                    to: { type: 'customsale_kod_returnrequest', id: id }
                })
    
                //context.response.write(file.load({id:fid}).url )
                log.debug('test', 5)
                //response.setContentType('PDF', 'itemlabel.pdf', 'inline');
                log.debug('test', 6)
                //response.writePage(pdf);
        
            } catch(err) {
                log.debug('DEBUG', err.message);
                response.write(err + ' (line number: ' + err.lineno + ')');
                return;
            }
        }catch(exception){
            log.debug('DEBUG', 'Error in generatePdf: ' + exception);
        }
    }
    return {
        onRequest: generatePdf
    };
});
