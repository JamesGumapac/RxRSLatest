/**
*@NApiVersion 2.x
*@NScriptType Suitelet
* 
*/
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/redirect'],
function(render, record, file, search, redirect){
    var mrr_id;
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
            log.debug('test', request.parameters.custscript_kd_rr_id);
            try {
				var id = request.parameters.custscript_kd_rr_id;
                if(!id) {
                    response.write('id parameter missing');
                }
            log.debug('test', '1');
                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: id
                });
            log.debug('test', '2');
                var renderer = render.create();
                var template = file.load({
                    id: 'SuiteScripts/kd_rxrs_form222_pdfhtml_tmplt.xml'
                });
                
            log.debug('test', '3');
              	renderer.templateContent = template.getContents();
            log.debug('test', '4');
                renderer.addRecord('record', rrRec);
            log.debug('test', '5');
                var xml = renderer.renderAsString();
            log.debug('test', '6');
                //var pdf = render.xmlToPdf(xml);
            log.debug('test', '7');
                var pdf = renderer.renderAsPdf();
            log.debug('test', '8');
                pdf.folder = getMrrFolder(id);//config.getValue({fieldId: 'custrecord_extpdf_temp_folder'});
            log.debug('test', '9');
              	var lookupRs = search.lookupFields({
                    type: 'customsale_kod_returnrequest',
                    id:  id,
                    columns: ['tranid','custbody_kd_labels_generated']
                }); 
                
            log.debug('test', '10');
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
				if(lookupRs.custbody_kd_labels_generated === true){
                record.submitFields({
                    type: 'customsale_kod_returnrequest',
                    id: id,
                    values: {
                        'transtatus': 'J' //'D'
                      
                    }
                });
                }
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
