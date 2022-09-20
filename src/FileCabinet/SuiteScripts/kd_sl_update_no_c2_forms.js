/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType suitelet
 */
 define(['N/record', 'N/search', 'N/url', 'N/ui/serverWidget'], 
 function(record, search,url, ui) {
     var REC_RET_REQ = 'customsale_kod_returnrequest';
     var REC_RET_PACKAGE = 'customrecord_kod_mr_packages';
     var SEA_RR_RETURN_PACKAGES = 'customsearch_kd_rr_return_packages';
     var FLD_RP_RETREQ = 'custrecord_kod_packrtn_rtnrequest';
     var FLD_RP_NO_C2 = 'custrecord_kd_c2forms';

     function main(context) {
         var form = null;
         var stAction = context.request.parameters['custpage_no_c2'];
         if(stAction)
             form = updateNoC2(context);
         else
             form = showPage(context);
         context.response.writePage(form);
     }
     function updateNoC2(context){
 
         var retReqId = context.request.parameters['custpage_retreq_id'];
         var noC2 = context.request.parameters['custpage_no_c2'];
         try{
            log.debug('updateNoC2', 'rr id' + retReqId);
            log.debug('updateNoC2', 'no c2' + noC2);

            var returnPackagesSearch = search.load(SEA_RR_RETURN_PACKAGES);
            returnPackagesSearch.filters.push(search.createFilter({
                name: FLD_RP_RETREQ,
                operator: search.Operator.ANYOF,
                values: retReqId
            }));

            var searchRs = returnPackagesSearch.run();
            var rs = searchRs.getRange(0, 1000);
            var rpId;
            for(var i = 0; i < rs.length; i++){
                var rpId = rs[i].getValue({
                    name: 'internalid', 
                    summary: search.Summary.GROUP}
                );
                log.debug('debug', 'type: ' + rpId);
                record.submitFields({
                    type: REC_RET_PACKAGE,
                    id: rpId,
                    values: {
                        'custrecord_kd_c2forms': noC2
                    }
                });
                log.debug('updateNoC2', 'RP ' + rpId + ' is updated.')
            }

             var form = ui.createForm({
                 title: 'Update No. C2 Forms',
                 hideNavBar: true
             });
             var inline=form.addField({
                 id: 'custpage_retreq_id',
                 label: 'Return Request ID',
                 type: ui.FieldType.INLINEHTML
             });
             /*var id = record.submitFields({
                 type: 'purchaseorder',
                 id: retReqId,
                 values: {
                     custbody_af_tbf_rejectreason: noC2
                 },
                 options: {
                     enableSourcing: false,
                     ignoreMandatoryFields : true
                 }
             });*/
 
             var output = url.resolveRecord({
                     recordType: REC_RET_REQ,
                     recordId: retReqId,
                     isEditMode: false
                 });
                 inline.defaultValue =
                     "<script language='javascript'>" +
                     "window.opener.location='"+output+"';" +
                     "window.ischanged = false;" +
                     "window.close();" +
                     "</script>";
 
                 return form;
         }catch(err){
             log.error('e',err.toString());
         }
     }
    function showPage(context) {
        try {
            var form = ui.createForm({
                title: 'Update No. C2 Forms',
                hideNavBar: true
            });
            log.debug('test', 'form created');
            var inline = form.addField({
                id: 'custpage_retreq_id',
                label: 'Return Request ID',
                type: ui.FieldType.TEXT
            });
            log.debug('test', 'rr id added');
            inline.defaultValue = context.request.parameters['custscript_id'];
            log.debug('rr id set', context.request.parameters['custscript_id']);
            inline.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            var fldLine =form.addField({
                id: 'custpage_no_c2',
                label: 'No. C2 Forms',
                type: ui.FieldType.TEXT,
            });
            fldLine.isMandatory = true;
            form.addSubmitButton({
                label: 'Submit'
            });
        
            log.debug('added submit button', 'test');
            return form;
        } catch (err) {
            log.error('err showPage', err.toString());
        }
     }
 
     return {
         onRequest: main
     };
 });
 