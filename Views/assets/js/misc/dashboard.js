$('#dashboard').on('click', () => {
    click_dashboard();
});
function calculate_remaining_days(date_1) {
    let date_2 = new Date()
    let difference = date_1.getTime() - date_2.getTime();
    let remaining_days = Math.ceil(difference / (1000 * 3600 * 24));
    return remaining_days;
}

function calculate_remaining_hours(date_1) {
    var dateNow = new Date();

    var seconds = Math.floor((date_1 - (dateNow)) / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    hours = hours - (days * 24);

    return hours

}


function create_calendar(chain) {
    $.get("https://nftcalendar.io/api/v1/events/upcoming?blockchain=" + chain, function (resp) {
        count = 10;
        resp['data'].forEach(function (event) {
            if (count > 0) {
                if (count == 10) classname = 'active'; else classname = '';
                let event_date = event['start_date_utc'];
                let remaining_days = calculate_remaining_days(new Date(event_date));
                let remaining_hours = calculate_remaining_hours(new Date(event_date));
                div = '<div class="carousel-item col-12 col-sm-6 col-md-4 col-lg-3 ' + classname + ' carousel-dash">' +
                    '<img src="' + event['image_featured'] + '" class="img-fluid mx-auto d-block" alt="img1" width="330" height="82">' +
                    '<div class="carousel-time">' + remaining_days + ' days ' + remaining_hours + ' hours</div>' +
                    '<div style="font-size:12px;text-align: center;">' + event['title'] + '</div>' +
                    '</div>';


                $('#' + chain + '_calendar').append(div);
                count--;
            }
        });
        // Instantiate the Bootstrap carousel
        $('.multi-item-carousel').carousel({
            interval: 2000
        });

        $('#carousel-' + chain).on('slide.bs.carousel', function (e) {
            var $e = $(e.relatedTarget);
            var idx = $e.index();
            var itemsPerSlide = 3;
            var totalItems = $('.carousel-item').length;

            if (idx >= totalItems - (itemsPerSlide - 1)) {
                var it = itemsPerSlide - (totalItems - idx);
                for (var i = 0; i < it; i++) {
                    // append slides to end
                    if (e.direction == "left") {
                        $('.carousel-item').eq(i).appendTo('.carousel-inner');
                    }
                    else {
                        $('.carousel-item').eq(0).appendTo('.carousel-inner');
                    }
                }
            }
        });
    });


}
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month
    return time;
}
async function build_graph() {
    let eth_price = [];
    let coin_date = [];
    let sol_price = [];
    await $.get("https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=6&&interval=daily", function (data) {
        prices = data['prices'];
        prices.forEach(price => {
            eth_price.push(price[1]);
            coin_date.push(timeConverter(price[0]));
        });
    });
    await $.get("https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=6&&interval=daily", function (data) {
        prices = data['prices'];
        prices.forEach(price => {
            sol_price.push(price[1]);
        });
    });
    Highcharts.setOptions({
        colors: ['#4FFFA3', '#FFF800']
    });
    const chart = Highcharts.chart('chart_container', {
        chart: {
            type: 'column',
            backgroundColor: '#2F2E33'

        },
        title: {
            text: 'Crypto Prices Per USD'
        },
        /*labels:{
            items:[{ style:{"color": "#fffff"}}]
        },*/
        credits: {
            enabled: false
        },
        xAxis: {
            categories: coin_date,
            crosshair: true
        },
        yAxis: {
            labels: {
                style: { "color": "#fffff" }
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.1,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Ethereum',
            data: eth_price

        }, {
            name: 'Solana',
            data: sol_price

        }]
    });
}
function click_dashboard() {
    $('#dashboard-template').load('./../html/dashboard.html', async () => {
        ipcRenderer.invoke('get_dash_data').then((result) => {
            // console.log(result);
            var image = new Image();
            image.src = result['user_data']['discord']['avatar_url'];
            image.width = 56;
            image.height = 56;
            $('.dashboard-user-logo').append(image);
            $('.dashboard-user-name').html('<span style="padding-top: 20px;padding-left:10px;">' + result['user_data']['discord']['name'] + '</span>');
            $('.dashboard-welcome').html('Welcome back to ANB, ' + result['user_data']['discord']['name']);
            $('.license-key').html(result['user_data']['key']);
            // $('.base-price').html(result['gas_prices']['low']);
            // $('.rapid-price').html(result['gas_prices']['high']);
            let date_1 = new Date(result['user_data']['expiry']);
            let remaining_days = calculate_remaining_days(date_1)
            $('.next-renewal').html(remaining_days + ' Days');
            create_calendar('ethereum');
            create_calendar('solana');
            build_graph();
        });
    });
}