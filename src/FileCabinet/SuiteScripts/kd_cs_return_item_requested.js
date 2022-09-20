/**
 *@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/search'],
function(search) {
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var FLD_RIR_FORM_222_REF_NUM = 'custrecord_kd_rir_form222_ref';
    var RIR_FLD_FORM_222_NO = 'custrecord_kd_rir_form_222_no';
    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var rirForm222RefNum = currentRecord.getValue(FLD_RIR_FORM_222_REF_NUM);
        
        if(rirForm222RefNum != '' && rirForm222RefNum != null){
            var rirCountSearch = search.create({
                type: REC_RETURN_ITEM_REQUESTED,
                columns: [search.createColumn({
                    name: 'internalid',
                    summary: search.Summary.COUNT
                })],
                filters: [{
                    name: FLD_RIR_FORM_222_REF_NUM,
                    operator: 'anyof',
                    values: [rirForm222RefNum]
                }]
            });
            var rs = rirCountSearch.run().getRange(0,1);
            var rirCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
            log.debug('saveRecord', 'RIR COUNT: ' + rirCount);
            if(rirCount >= 20){
                alert('There are already 20 items on Form 222 No. ' + currentRecord.getValue(RIR_FLD_FORM_222_NO));
                return false;
            }
        }
      	return true;
    }
    return {
        saveRecord: saveRecord
    };
});