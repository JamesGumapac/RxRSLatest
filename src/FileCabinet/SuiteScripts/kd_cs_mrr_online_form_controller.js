/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/search', 'N/format'],
    function (url, currentRecord, search, format) {

        //
        function fieldChanged(context) {
            var rxotcNumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_rx_otc_no_labels'
            })
            var rxotcPickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_rx_otc_pickup_date'
            })
            var c3_5NumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c3_5_no_labels'
            })
            var c3_5PickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c3_5_pickup_date'
            })
            var c2_NumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c2_no_labels'
            })
            var c2_PickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c2_pickup_date'
            })
            var rxotcFile = context.currentRecord.getField({
                fieldId: 'custpage_rxotc_file'
            })
            var c3_5File = context.currentRecord.getField({
                fieldId: 'custpage_c3_5_file'
            })
            var c2_File = context.currentRecord.getField({
                fieldId: 'custpage_c2_file'
            })

            var  c2 = context.currentRecord.getText({
                fieldId: 'custpage_c2'
            })
            var c3_5 = context.currentRecord.getText({
                fieldId: 'custpage_c3_5'
            })
            var rxtoc = context.currentRecord.getText({
                fieldId: 'custpage_rxotc'
            })
            if( rxtoc === 'T' ){
                rxotcNumOfLabels.isDisabled = false
                rxotcPickUpDate.isDisabled = false
                rxotcFile.isDisabled = false
            }else{
                rxotcNumOfLabels.isDisabled = true
                rxotcPickUpDate.isDisabled = true
                rxotcFile.isDisabled = true
            }
            if( c2 === 'T' ){
                c2_NumOfLabels.isDisabled = false
                c2_PickUpDate.isDisabled = false
                c2_File.isDisabled = false
            }else{
                c2_NumOfLabels.isDisabled = true
                c2_PickUpDate.isDisabled = true
                c2_File.isDisabled = true
            }
            if( c3_5 === 'T' ){
                c3_5NumOfLabels.isDisabled = false
                c3_5PickUpDate.isDisabled = false
                c3_5File.isDisabled = false
            }else{
                c3_5PickUpDate.isDisabled = true
                c3_5NumOfLabels.isDisabled = true
                c3_5File.isDisabled = true
            }




        }


        function pageInit(context) {
            var rec = context.currentRecord;
            var requesteDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_rx_otc_no_labels'
            })
            var rxotcNumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_rx_otc_no_labels'
            })
            var rxotcPickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_rx_otc_pickup_date'
            })
            var c3_5NumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c3_5_no_labels'
            })
            var c3_5PickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c3_5_pickup_date'
            })
            var c2_NumOfLabels = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c2_no_labels'
            })
            var c2_PickUpDate = context.currentRecord.getField({
                fieldId: 'custpage_kd_mrr_c2_pickup_date'
            })
            var rxotcFile = context.currentRecord.getField({
                fieldId: 'custpage_rxotc_file'
            })
            var c3_5File = context.currentRecord.getField({
                fieldId: 'custpage_c3_5_file'
            })
            var c2_File = context.currentRecord.getField({
                fieldId: 'custpage_c2_file'
            })


            rxotcNumOfLabels.isDisabled = true
            rxotcPickUpDate.isDisabled = true
            c3_5NumOfLabels.isDisabled = true
            c3_5PickUpDate.isDisabled = true
            c2_NumOfLabels.isDisabled = true
            c2_PickUpDate.isDisabled = true
            rxotcFile.isDisabled = true
            c3_5File.isDisabled = true
            c2_File.isDisabled = true
            var date = new Date()
            console.log('Date ' + date)
            rec.setValue({
                fieldId: 'custpage_kod_mr_requestd',
                value: date
            })
        }


        //
        // function generateExcelFile(intSessionId) {
        //     var objRecord = currentRecord.get();
        //     var location;
        //     var year;
        //     var month;
        //     var property;
        //     var yearVal
        //
        //     month = objRecord.getText({
        //         fieldId: 'custpage_month'
        //     })
        //     year = objRecord.getText({
        //         fieldId: 'custpage_year'
        //     })
        //     yearVal = objRecord.getValue({
        //         fieldId: 'custpage_year'
        //     })
        //     location = objRecord.getValue({
        //         fieldId: 'custpage_location_filter'
        //     })
        //     property = objRecord.getText({
        //         fieldId: 'custpage_location_filter'
        //     })
        //
        //
        //
        //     var currInstanceChecker = search.load({id:'customsearch577'});
        //     var checkInstCount = currInstanceChecker.runPaged().count;
        //     var objParametersToProcess = {
        //         "year": encodeURIComponent(year),
        //         "month": encodeURIComponent(month),
        //         "property": encodeURIComponent(location),
        //         "location": encodeURIComponent(property),
        //         "yearVal" : encodeURIComponent(yearVal),
        //         "searchFilter": 'T'
        //     };
        //
        //     if(checkInstCount){
        //         alert('There is a current instance of search that is runnning on the backend. Kindly wait for a few minutes...');
        //         return;
        //     } else{
        //         alert('Report will be sent to your email address. Please wait.')
        //         document.location = url.resolveScript({
        //             scriptId: 'customscriptats_sl_mis_report',
        //             deploymentId: 'customdeployats_sl_mis_report',
        //             params: objParametersToProcess
        //         })
        //
        //     }
        //
        //
        //
        // }




        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit,
            // filterData : filterData,
            // sublistToCsv : sublistToCsv,
           // generateExcelFile: generateExcelFile
            // requestNewSnapshot: requestNewSnapshot
        };

    });