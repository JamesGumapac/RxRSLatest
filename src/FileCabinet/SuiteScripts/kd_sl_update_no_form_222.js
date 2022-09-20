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
        var stAction = context.request.parameters['custpage_no_form_222'];
        if(stAction)
            form = updateNoForm222(context);
        else
            form = showPage(context);
        context.response.writePage(form);
    }
    var REC_FORM222_REF = 'customrecord_kd_222formrefnum';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var FLD_FORM222_RR = 'custrecord_kd_returnrequest';
    var FLD_FORM222_PAGE = 'custrecord_kd_form222_page';
    var FLD_RIR_FORM222_NO = 'custrecord_kd_rir_form_222_no';
    var SEA_FORM222_REF = 'customsearch_kd_222_form_ref_num';
    var SEA_C2_RIR = 'customsearch_kd_return_item_requested';
    function updateNoForm222(context){
        var retReqId = context.request.parameters['custpage_retreq_id'];
        var noForm222 = context.request.parameters['custpage_no_form_222'];
        try{
            log.debug('updateNoForm222', 'rr id' + retReqId);
            log.debug('updateNoForm222', 'no form 222 ' + noForm222);

            var rrRec = record.load({
                type: REC_RET_REQ,
                id: retReqId,
                isDynamic: true,
            });
            log.debug('updateNoForm222', 'record loaded');
            var currentNoForm222 = rrRec.getValue('custbody_kd_no_form_222');
            var c2RirCount = rrRec.getLineCount('custpage_sublist_items_requested');
            log.debug('updateNoForm222', 'c2RirCount ' + c2RirCount);

            if(noForm222 == 0){
                throw('ERR', 'No. of Form 222 cannot be 0.');
            }else if(noForm222 > c2RirCount){
                throw('ERR', 'No. of Form 222 cannot be greater than the Return Items Rewquested.');
            }else{
                var form222RefRec;
                if(noForm222 > currentNoForm222){
                    for(var i = parseInt(currentNoForm222)+1; i <= noForm222; i++){
                        form222RefRec = record.create({
                            type: REC_FORM222_REF,
                            isDynamic: true
                        });
                        form222RefRec.setValue({
                            fieldId: FLD_FORM222_PAGE,
                            value: i,
                            ignoreFieldChange: true
                        });
                        form222RefRec.setValue({
                            fieldId: FLD_FORM222_RR,
                            value: retReqId,
                            ignoreFieldChange: true
                        });
                        form222RefRec.save()
                    }
                }else{
                    log.debug('test', 1);
                    var form222RefSearch = search.load({
                        id: SEA_FORM222_REF
                    });
                    form222RefSearch.filters.push(search.createFilter({
                        name: FLD_FORM222_RR,
                        operator: search.Operator.ANYOF,
                        values: retReqId
                    }));
                    form222RefSearch.filters.push(search.createFilter({
                        name: FLD_FORM222_PAGE,
                        operator: search.Operator.GREATERTHAN,
                        values: noForm222
                    }));
                    var form222RefRecIds = [];
                    var rs = form222RefSearch.run().getRange({start: 0, end: 1000});
                    for(var i = 0; i < rs.length; i++){
                        form222RefRecIds.push(rs[i].id);
                    }
                    log.debug('TEST', 'form222RefRecIds ' + JSON.stringify(form222RefRecIds))

                    var rirSearch = search.load({
                        id: SEA_C2_RIR
                    });
                    rirSearch.filters.push(search.createFilter({
                        name: FLD_RIR_FORM222_NO,
                        operator: search.Operator.GREATERTHAN,
                        values: noForm222
                    }));
                    rs = rirSearch.run();
                    var start = 0;
                    var end = 1000;
                    var rirSearchResults = rs.getRange({start: start, end: end});
                    while(rirSearchResults.length > 0){
                        for(var i = 0; i < rirSearchResults.length; i++){
                            record.submitFields({
                                type: REC_RETURN_ITEM_REQUESTED,
                                id: rirSearchResults[i].id,
                                values: {
                                    'custrecord_kd_rir_form_222_no': '',
                                    'custrecord_kd_rir_form222_ref': ''
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                        }

                        start += 1000;
                        end += 1000;
                        rirSearchResults = rs.getRange({start: start, end: end});
                    }

                    for(var i = 0; i < form222RefRecIds.length; i++){
                        record.delete({
                            type: REC_FORM222_REF,
                            id: form222RefRecIds[i],
                        });                
                    }
                }
                rrRec.setValue({
                    fieldId: 'custbody_kd_no_form_222',
                    value: noForm222,
                    ignoreFieldChange: true
                });

                rrRec.save();
                log.debug('updateNoForm222', 'record saved');
            }

            var form = ui.createForm({
                title: 'Update No. Form 222',
                hideNavBar: true
            });
            var inline=form.addField({
                id: 'custpage_retreq_id',
                label: 'Return Request ID',
                type: ui.FieldType.INLINEHTML
            });
            log.debug('test', 'trying to');
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
                title: 'Update No. Form 222',
                hideNavBar: true
            });
            log.debug('test', 'form created');
            var inline = form.addField({
                id: 'custpage_retreq_id',
                label: 'Return Request ID',
                type: ui.FieldType.TEXT
            });
            log.debug('test', 'rr id added');
            inline.defaultValue = context.request.parameters['custscript_kd_updatenoform222_rr_id'];
            log.debug('rr id set', context.request.parameters['custscript_kd_updatenoform222_rr_id']);
            inline.updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            var fldLine =form.addField({
                id: 'custpage_no_form_222',
                label: 'No. Form 222',
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
 