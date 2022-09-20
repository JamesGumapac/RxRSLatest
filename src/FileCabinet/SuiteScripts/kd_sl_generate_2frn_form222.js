/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 */
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/redirect'],
    function(render, record, file, search, redirect){
        var FOLDER_MRR = 809;
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
        function getReturnRequestFolder(rrName, rrId, mrrFolderId){
            log.debug('getReturnRequestFolder', 'mrr folder id: ' + mrrFolderId);
            var folderId = search.create({
                type: 'folder',
                filters: [
                    ['name', 'is', rrName],
                    'and',
                    ['parent', 'anyof', [mrrFolderId]]
                ]
            }).run().getRange({ start: 0, end: 1 });

            var rrFolderId;
            if(folderId.length <= 0){
                var folder = record.create({ type: record.Type.FOLDER});
                folder.setValue({ fieldId: 'name',
                    value: rrName});
                folder.setValue({ fieldId: 'parent',
                    value: mrrFolderId});
                var folderId = folder.save();
                log.debug('getReturnRequestFolder', folderId);
                rrFolderId = folderId;

            }else{
                log.debug('getReturnRequestFolder', folderId[0].id);
                rrFolderId = folderId[0].id;
            }
            return rrFolderId;
        }
        function generatePdf(context){
            try{
                var response = context.response;
                var request = context.request;
                //log.debug('generatePdf', 'Generate for RR ' + request.parameters.custscript_kd_rr_id);
                log.debug('generatePdf', 'Generate for 2FRN ' + request.parameters.custscript_kd_2frn_id);
                try {
                    var id = request.parameters.custscript_kd_2frn_id;
                    //var authorizedBy = request.parameters.custscript_kd_rr_authorized_by;
                    if(!id) {
                        response.write('id parameter missing');
                    }

                    var f2rnRec = record.load({
                        type: 'customrecord_kd_222formrefnum',//'customsale_kod_returnrequest',
                        id: id
                    });

                    var lookupRs = search.lookupFields({
                        type: 'customsale_kod_returnrequest',
                        id:  f2rnRec.getValue('custrecord_kd_returnrequest'),
                        columns: ['custbody_kd_master_return_id', 'tranid', 'internalid']
                    });
                    var rrTranId = lookupRs['tranid'];
                    var rrId = lookupRs['internalid'][0].value;
                    log.debug('generatePdf', 'lookup MRR ID: ' + lookupRs['custbody_kd_master_return_id'][0].value);
                    //var rrId = lookupRs['custbody_kd_master_return_id'][0].value;

                    var renderer = render.create();
                    var template = file.load({
                        id: 'SuiteScripts/kd_rxrs_2frn_pdfhtml_tmplt.xml'//'SuiteScripts/kd_rxrs_form222_pdfhtml_tmplt.xml'
                    });

                    renderer.templateContent = template.getContents();
                    renderer.addRecord('record', f2rnRec);
                    var xml = renderer.renderAsString();
                    var pdf = render.xmlToPdf(xml);
                    var pdf = renderer.renderAsPdf();
                    pdf.folder = getReturnRequestFolder(rrTranId, rrId, getMrrFolder(f2rnRec.getValue('custrecord_kd_returnrequest')));
                    //pdf.folder = getMrrFolder(f2rnRec.getValue('custrecord_kd_returnrequest'));
                    pdf.name = f2rnRec.getValue('name') + '_form222.pdf';//'RR' + id + '_form222.pdf';
                    var fid = pdf.save();
                    log.debug('generatePdf', 'PDF File ID: ' + fid);
                    var attachitem = record.attach({
                        record: { type: 'file', id: fid },
                        to: { type: 'customrecord_kd_222formrefnum', id: id }
                    });
                    record.submitFields({
                        type: 'customrecord_kd_222formrefnum',
                        id: id,
                        values: {
                            custrecord_kd_2frn_222_form_pdf: fid,
                            custrecord_kd_2frn_for_222_regeneration: false
                        }
                    });
                    //Look for all of the 222 form to check if all of file were printed
                    var rrRec = record.load({
                        type: 'customsale_kod_returnrequest',
                        id: rrId,
                        isDynamic: true
                    })
                    log.debug('RR Rec', rrRec)
                    var taskId;
                    var taskSearchObj = search.create({
                        type: "task",
                        filters:
                            [
                                ["custevent_kd_ret_req","anyof",rrId]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "internalid"}),
                            ]
                    });
                    var searchResultCount = taskSearchObj.runPaged().count;
                    log.debug("taskSearchObj result count",searchResultCount);
                    taskSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        taskId = result.getValue({name: 'internalid'})
                        return true;
                    });
                    var all222FormFileSearch = search.load({
                        id: 'customsearch_kd_222_form_file_search_2'
                    })
                    all222FormFileSearch.filters.push(search.createFilter({
                        name:'custrecord_kd_returnrequest',
                        operator: 'anyof',
                        values: rrId
                    }));
                    var searchResultCount = 0
                    var form222FileCount = 0;
                    all222FormFileSearch.run().each(function(result){
                        form222FileCount = result.getValue({
                            name: 'custrecord_kd_2frn_222_form_pdf',
                            summary: "COUNT"
                        })
                        searchResultCount = result.getValue({
                            name: 'id',
                            summary: "COUNT"
                        })
                        return true;
                    });
                    log.debug('Search Result Count ', searchResultCount )
                    log.debug('222 Form File Count', form222FileCount)
                    //Update tasks record;
                    if(searchResultCount > 0 && searchResultCount == form222FileCount){
                        log.debug('All 222 forms are generated')
                        var taskRec;
                        if(taskId) {
                            taskRec = record.load({
                                type: "task",
                                id: taskId,
                                isDynamic: true
                            })
                        }
                        log.audit('Task Rec',taskRec)
                        taskRec.setValue({fieldId:'custevent_kd_222_form_generated',value: true })
                        var isTrackingNumberGenerated = taskRec.getValue('custevent_kd_tracking_num')
                        if(isTrackingNumberGenerated == true){
                            log.debug('tracking number is generated')
                            if(rrRec.getValue('transtatus') == "J"){
                                log.debug('RR Rec Status is C2Kit to be mailed')
                                rrRec.setValue({fieldId:'transtatus',value: 'D'})
                                taskRec.setValue({fieldId: 'status',value: 'COMPLETE'})
                                taskRec.setValue({fieldId:'custevent_kd_222_form_generated',value:true })

                                log.audit('Updating task record and return request ' + rrId)
                                // var taskIdRec = record.submitFields({
                                //     type: 'customsale_kod_returnrequest',
                                //     id: taskRec.id,
                                //     values: {
                                //         'status': 'COMPLETE',
                                //        'custevent_kd_222_form_generated':true
                                //     }
                                // })

                            }
                        }


                    }
                    var taskIdRec = taskRec.save({ignoreMandatoryFields: true})
                    var rrRecId = rrRec.save({ignoreMandatoryFields:true})

                    log.audit('Task Rec ID ' , taskIdRec)
                    /*record.submitFields({
                        type: 'customsale_kod_returnrequest',
                        id: id,
                        values: {
                            'transtatus': 'C', //'D'
                            //'custbody_kd_authorized_by': authorizedBy
                        }
                    });*/

                    log.debug('generatePdf', 'Attached file ' + fid + ' to RR ' + id);
                    redirect.toRecord({
                        type: 'customrecord_kd_222formrefnum',
                        id: id
                    });
                }catch(err){
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
