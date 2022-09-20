/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/error'],
function(error) {
    var REC_PAYMENT_SCHEDULE = 'customrecord_kd_payment_schedule';
    var FLD_PAYSCHED_MIN_DAYS = 'custrecord_kd_paysched_min_days';
    var FLD_PAYSCHED_MAX_DAYS = 'custrecord_kd_paysched_max_days';

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;

        if(context.fieldId == FLD_PAYSCHED_MIN_DAYS || context.fieldId == FLD_PAYSCHED_MAX_DAYS){
            var minDays = currentRecord.getValue(FLD_PAYSCHED_MIN_DAYS);
            var maxDays = currentRecord.getValue(FLD_PAYSCHED_MAX_DAYS);

            if(minDays > maxDays){
                alert('Minimum Days cannot be greater than Maximum Days.');
            }     
        }
    }
    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var minDays = currentRecord.getValue(FLD_PAYSCHED_MIN_DAYS);
        var maxDays = currentRecord.getValue(FLD_PAYSCHED_MAX_DAYS);

        if(minDays > maxDays){
            alert('Minimum Days cannot be greater than Maximum Days.');
            return false;
        }     
        
        return true;
    }
    return {
        saveRecord: saveRecord
    };
});