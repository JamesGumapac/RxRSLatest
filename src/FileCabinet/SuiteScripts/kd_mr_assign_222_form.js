/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*/
define(['./kd_rxrs_constants.js', 'N/search', 'N/record'],
function(constants, search, record){
    var REC_RET_REQ = 'customsale_kod_returnrequest';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    function getC2ItemsRequested(rrId){
        var c2ItemsRequested = [];
        var rirSearch = search.create({
            type: constants.RECORDS.RETURN_ITEM_REQUESTED,
            columns: [
                search.createColumn({
                    name: 'internalid',
                    sort: search.Sort.ASC
                })
            ],
            filters: [{
                name: constants.RECORDFIELDS.RIR_RETURN_REQUEST,
                operator: 'anyof',
                values: [rrId]
            }, {
                name: constants.RECORDFIELDS.RIR_222_FORM_REF,
                operator: 'anyof',
                values: ['@NONE@']
            }]
        });
        var result = rirSearch.run();
        result.each(function (row) {
            c2ItemsRequested.push(
                row.getValue({
                    name: 'internalid'
                })
            );
            return true;
        });
        return c2ItemsRequested;
    }
    function get222Forms(rrId){
        try{
            var form222s = [];
            var f2rnSearch = search.create({
                type: constants.RECORDS.FORM_222_REFERENCE_NUMBER,
                columns: [
                    search.createColumn({
                        name: 'internalid'
                    }),
                    search.createColumn({
                        name: constants.RECORDFIELDS.F2RN_PAGE,
                        sort: search.Sort.ASC
                    })
                ],
                filters: [{
                    name: constants.RECORDFIELDS.F2RN_RETURN_REQUEST,
                    operator: 'anyof',
                    values: [rrId]
                }]
            });
            var result = f2rnSearch.run();
            result.each(function (row) {
                form222s.push(
                    row.getValue({
                        name: 'internalid'
                    })
                );
                return true;
            });
            return form222s;
        }catch(ex){
            log.debug('get222forms catch', JSON.stringify(ex));
        }
    }
    function getRirCountOn222Form(f2rnIds){//gets the count of the Return Items Requested already assigned on the existing 222 Form Reference Number records
        var f2rnRirCounts = {};
        var arrangedF2rnRirCounts = {};
        try{
            var rirCountSearch = search.create({
                type: constants.RECORDS.RETURN_ITEM_REQUESTED,
                columns: [
                    search.createColumn({
                        name: 'internalid',
                        join: constants.RECORDFIELDS.RIR_222_FORM_REF,
                        summary: search.Summary.GROUP
                    }),
                    search.createColumn({
                        name: 'internalid',
                        summary: search.Summary.COUNT
                    })
                ],
                filters: [{
                    name: constants.RECORDFIELDS.RIR_222_FORM_REF,
                    operator: 'anyof',
                    values: f2rnIds
                }]
            });
            var result = rirCountSearch.run();
            var f2rnId, rirCount;
            result.each(function (row) {
                f2rnId = row.getValue({
                    name: 'internalid',
                    join: constants.RECORDFIELDS.RIR_222_FORM_REF,
                    summary: search.Summary.GROUP
                });
                rirCount = row.getValue({
                    name: 'internalid',
                    summary: search.Summary.COUNT
                });
                f2rnRirCounts[f2rnId] = rirCount;
                return true;
            });
            for(var i = 0; i < f2rnIds.length; i++){
                f2rnId = f2rnIds[i];
                if(!f2rnRirCounts.hasOwnProperty(f2rnId)){
                    arrangedF2rnRirCounts[f2rnId] = 0;
                }else{
                    arrangedF2rnRirCounts[f2rnId] = f2rnRirCounts[f2rnId];
                }
            }
            //log.debug('TEST HERE', 'f2rnIds: ' + JSON.stringify(f2rnIds));
            //log.debug('TEST HERE', 'arrangedF2rnRirCounts: ' + JSON.stringify(arrangedF2rnRirCounts));
            for(var i = f2rnIds.length-1; i >= 0; i--){
                f2rnId = f2rnIds[i];
                if(arrangedF2rnRirCounts[f2rnId] == 20){
                    f2rnIds.splice(i, 1);
                    delete arrangedF2rnRirCounts[f2rnId];
                }
            }
            return arrangedF2rnRirCounts;
        }catch(ex){
            log.debug('getRirCountOn222Form catch', ex)
        }
    }
    function getf2rnNextPageNumber(rrId){
        try{
            var f2rnSearch = search.create({
                type: constants.RECORDS.FORM_222_REFERENCE_NUMBER,
                columns: [search.createColumn({
                    name: 'internalid',
                    summary: search.Summary.COUNT
                })],
                filters: [{
                    name: constants.RECORDFIELDS.F2RN_RETURN_REQUEST,
                    operator: 'anyof',
                    values: [rrId]
                }]
            });
            var rs = f2rnSearch.run().getRange(0,1);
            var f2rnNextPage = parseInt(rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT})) + parseInt(1);
            return f2rnNextPage;
        }catch(ex){
            log.debug('getf2rnNextPageNumber catch', ex);
        }
    }
    function createF2rn(rrId){
        try{  
            var f2rnRecord = record.create({
                type: 'customrecord_kd_222formrefnum', //constants.RECORDS.FORM_222_REFERENCE_NUMBER,
                isDynamic: true
            });
            f2rnRecord.setValue({
                fieldId: constants.RECORDFIELDS.F2RN_RETURN_REQUEST,
                value: rrId,
                //ignoreFieldChange: true
            });
            f2rnRecord.setValue({
                fieldId: 'name',
                value: '000000000',
                ignoreFieldChange: true
            });
            var f2rnPage = getf2rnNextPageNumber(rrId);
            f2rnRecord.setValue({
                fieldId: constants.RECORDFIELDS.F2RN_PAGE,
                value: f2rnPage,
                ignoreFieldChange: true
            });
            return f2rnRecord.save();
        }catch(ex){
            log.debug('createF2rn catch', ex)
        }
    }
    function is222FormRefForRegeneration(f2rnId){
        var fieldLookUp = search.lookupFields({
            type: constants.RECORDS.FORM_222_REFERENCE_NUMBER,
            id: f2rnId,
            columns: ['custrecord_kd_2frn_222_form_pdf']
        });
        //log.debug('is222FormRefForRegeneration', JSON.stringify(fieldLookUp['custrecord_kd_2frn_222_form_pdf']))
        if(fieldLookUp.length > 0 && fieldLookUp['custrecord_kd_2frn_222_form_pdf'][0].text != '')
            return true;
        return false;
    }
    function flagF2rnsForRegeneration(usedF2rns){
        for(var usedF2rnIdIndx = 0; usedF2rnIdIndx < usedF2rns.length; usedF2rnIdIndx++){
            //log.debug('flagF2rnsForRegeneration', 'flag ' + usedF2rns[usedF2rnIdIndx] + ' for regeneration.');
            if(is222FormRefForRegeneration(usedF2rns[usedF2rnIdIndx])){
                record.submitFields({
                    type: constants.RECORDS.FORM_222_REFERENCE_NUMBER,
                    id: usedF2rns[usedF2rnIdIndx],
                    values: {
                        custrecord_kd_2frn_for_222_regeneration: true
                    }
                });
            }
        }
    }
    function assign222Form(rrId){
        //log.debug('assign222Form', 'START');
        var rirIds = getC2ItemsRequested(rrId);
        var f2rnIds = get222Forms(rrId);
        var f2rnRirCounts = getRirCountOn222Form(f2rnIds);
        var f2rnId, f2rnRirCount, isF2rnAssigned, rirId, usedF2rns = [];

        //log.debug('assign222Form', 'RR RIRs: ' + JSON.stringify(rirIds));
        //log.debug('assign222Form', 'RR F2RNs: ' + JSON.stringify(f2rnIds));
        //log.debug('assign222Form', 'F2RN RIR Count: ' + JSON.stringify(f2rnRirCounts));

        for(var rirIdIndx = 0; rirIdIndx < rirIds.length; rirIdIndx++){
            isF2rnAssigned = false;
            
            log.debug('LOG FOR DELETE', 'line no: ' + rirIdIndx);
            for(var f2rnIdIndx = 0; f2rnIdIndx < f2rnIds.length; f2rnIdIndx++){
                f2rnId = f2rnIds[f2rnIdIndx];
                f2rnRirCount = f2rnRirCounts[f2rnId];
                //log.debug('TEST', 'f2rn ' + f2rnId + ' rir count is ' + f2rnRirCount);
                if(f2rnRirCount < 20){
                    rirId = record.submitFields({
                        type: constants.RECORDS.RETURN_ITEM_REQUESTED,
                        id: rirIds[rirIdIndx],
                        values: {
                            custrecord_kd_rir_form222_ref: f2rnId
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields : true
                        }
                    });
                    if(usedF2rns.indexOf(f2rnId) < 0)
                        usedF2rns.push(f2rnId);
                    //log.debug('TEST', 'rirId ' + rirId + ' is updated with ' + f2rnId);
                    isF2rnAssigned = true;
                    f2rnRirCounts[f2rnId] = parseInt(f2rnRirCounts[f2rnId]) + parseInt(1);
                    //log.debug('TEST', 'f2rn ' + f2rnId + ' rir count is ' + f2rnRirCounts[f2rnId]);
                    if(f2rnRirCounts[f2rnId] == 20){
                        f2rnIds.slice(f2rnIdIndx, 1);
                        delete f2rnRirCounts[f2rnId];
                    }
                    break;
                }
            }
            if(!isF2rnAssigned){
                //log.debug('TEST', 'createF2rn');
                f2rnId = createF2rn(rrId);log.debug('TEST', 'createF2rn 1');
                rirId = record.submitFields({
                    type: constants.RECORDS.RETURN_ITEM_REQUESTED,
                    id: rirIds[rirIdIndx],
                    values: {
                        custrecord_kd_rir_form222_ref: f2rnId
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });log.debug('TEST', 'createF2rn 2');
                f2rnIds.push(f2rnId);log.debug('TEST', 'createF2rn 3');
                log.debug('TEST', f2rnRirCounts == null);
                if(f2rnRirCounts == null) f2rnRirCounts = {};
                log.debug('TEST', JSON.stringify(f2rnRirCounts));
                f2rnRirCounts[f2rnId] = 1;log.debug('TEST', 'createF2rn 4');
                usedF2rns.push(f2rnId);log.debug('TEST', 'createF2rn 5');
                log.debug('LOG FOR DELETE', 'f2rns: ' + JSON.stringify(f2rnIds))
            }    
        }
        flagF2rnsForRegeneration(usedF2rns);
    }
    function getInputData(){
        log.debug('getInputData', 'START');
        var rrSearch = search.create({
            type: constants.RECORDS.RETURN_REQUEST,
            columns: [search.createColumn({
                name: 'internalid'
            })],
            filters: [{
                name: 'custbody_kd_for_222_form_assignment',
                operator: 'is',
                values: 'T'
            },{
                name: 'mainline',
                operator: 'is',
                values: 'T'
            }]
        });
        return rrSearch; 
    }
    function map(context){
        log.debug('map', 'START');
        try{
            var data = JSON.parse(context.value);
            var rrId = data.id;
            log.debug('map', rrId);
            assign222Form(rrId);
            //log.debug('TEST DEBUG HERE', rrId +  ' will be unmarked.');
            rrId = record.submitFields({
                type: constants.RECORDS.RETURN_REQUEST,
                id: rrId,
                values: {
                    custbody_kd_for_222_form_assignment: 'F'
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            //log.debug('TEST DEBUG HERE', rrId +  ' is unmarked for 222 form assignment');
        }catch(ex){
            log.error({ title: 'map: error', details: ex });
        }
        log.debug('map', 'END');
        //var mrrId = runtime.getCurrentScript().getParameter({name:'custscript_mrr_id'});
    }
    function summarize(summary){
        log.debug('summarize', 'START');
        /*var rrSearch = search.load({
            id: SEA_RR
        });
        rrSearch.filters.push(search.createFilter({
            name: FLD_RR_FOR_TAG_LABEL_GEN,
            operator: search.Operator.IS,
            values: true
        }));
        rrSearch.filters.push(search.createFilter({
            name: 'status',
            operator: search.Operator.IS,
            values: 'CuTrSale102:K'
        }));
        if(rrSearch.run().getRange({ start: 0, end: 1 }).length > 0){
            log.debug('TEST', 'there are still RR to be processed, scheduling another deployment.');
            try{
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_kd_mr_create_tag_labels'
                });
                var mrTaskId = mrTask.submit();
                var mrTaskStatus = task.checkStatus({
                    taskId: mrTaskId
                });
                log.debug('TEST', 'MR Task Status ' + mrTaskStatus);
            }catch(ex){
                log.error({title: 'map/reduce task creation', details: ex });
            }
        }*/
    }
    return{
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});