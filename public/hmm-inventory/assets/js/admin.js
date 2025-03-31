
/**
 * HMM Inventory Admin JavaScript
 */
(function($) {
    'use strict';
    
    // Global variables
    var HMM_Inventory = {
        init: function() {
            // Initialize components
            this.initTabs();
            this.initDatepickers();
            this.initProductSearch();
        },
        
        initTabs: function() {
            $('.hmm-tab-link').on('click', function() {
                var tabId = $(this).data('tab');
                
                $('.hmm-tab-link').removeClass('active');
                $(this).addClass('active');
                
                $('.hmm-tab-content').removeClass('active');
                $('#' + tabId + '-tab').addClass('active');
            });
        },
        
        initDatepickers: function() {
            // If jQuery UI datepicker is available
            if ($.datepicker) {
                $('.hmm-datepicker').datepicker({
                    dateFormat: 'yy-mm-dd'
                });
            }
        },
        
        initProductSearch: function() {
            // Autocomplete for product search
            if ($.ui && $.ui.autocomplete) {
                $('.hmm-product-search').autocomplete({
                    source: function(request, response) {
                        $.ajax({
                            url: hmm_inventory.ajax_url,
                            dataType: 'json',
                            data: {
                                action: 'hmm_search_products',
                                nonce: hmm_inventory.nonce,
                                term: request.term
                            },
                            success: function(data) {
                                response(data.data);
                            }
                        });
                    },
                    minLength: 2,
                    select: function(event, ui) {
                        $(this).val(ui.item.label);
                        $(this).next('input[type=hidden]').val(ui.item.value);
                        return false;
                    }
                });
            }
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        HMM_Inventory.init();
    });
    
})(jQuery);
