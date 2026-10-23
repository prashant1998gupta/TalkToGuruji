/** Birth-place lookup: Indian cities (IST) + major world cities. Coordinates are approximate (±0.05°), ample for charts. */

export type City = { id: string; name: string; region: string; lat: number; lon: number; tz: string };

// name|state|lat|lon  (all Asia/Kolkata)
const INDIA = `New Delhi|Delhi|28.61|77.21
Delhi|Delhi|28.65|77.23
Mumbai|Maharashtra|19.08|72.88
Kolkata|West Bengal|22.57|88.36
Chennai|Tamil Nadu|13.08|80.27
Bengaluru|Karnataka|12.97|77.59
Hyderabad|Telangana|17.39|78.49
Ahmedabad|Gujarat|23.02|72.57
Pune|Maharashtra|18.52|73.86
Jaipur|Rajasthan|26.91|75.79
Lucknow|Uttar Pradesh|26.85|80.95
Kanpur|Uttar Pradesh|26.45|80.33
Nagpur|Maharashtra|21.15|79.09
Indore|Madhya Pradesh|22.72|75.86
Bhopal|Madhya Pradesh|23.26|77.41
Thane|Maharashtra|19.22|72.98
Visakhapatnam|Andhra Pradesh|17.69|83.22
Patna|Bihar|25.59|85.14
Vadodara|Gujarat|22.31|73.18
Ghaziabad|Uttar Pradesh|28.67|77.45
Ludhiana|Punjab|30.90|75.86
Agra|Uttar Pradesh|27.18|78.01
Nashik|Maharashtra|20.00|73.79
Faridabad|Haryana|28.41|77.32
Meerut|Uttar Pradesh|28.98|77.71
Rajkot|Gujarat|22.30|70.80
Varanasi|Uttar Pradesh|25.32|82.97
Srinagar|Jammu and Kashmir|34.08|74.80
Aurangabad|Maharashtra|19.88|75.34
Dhanbad|Jharkhand|23.80|86.43
Amritsar|Punjab|31.63|74.87
Navi Mumbai|Maharashtra|19.03|73.03
Prayagraj|Uttar Pradesh|25.44|81.85
Ranchi|Jharkhand|23.34|85.31
Howrah|West Bengal|22.59|88.31
Coimbatore|Tamil Nadu|11.02|76.96
Jabalpur|Madhya Pradesh|23.18|79.99
Gwalior|Madhya Pradesh|26.22|78.18
Vijayawada|Andhra Pradesh|16.51|80.65
Jodhpur|Rajasthan|26.24|73.02
Madurai|Tamil Nadu|9.93|78.12
Raipur|Chhattisgarh|21.25|81.63
Kota|Rajasthan|25.21|75.86
Guwahati|Assam|26.14|91.74
Chandigarh|Chandigarh|30.73|76.78
Solapur|Maharashtra|17.66|75.91
Hubballi|Karnataka|15.36|75.12
Dharwad|Karnataka|15.46|75.01
Bareilly|Uttar Pradesh|28.37|79.43
Moradabad|Uttar Pradesh|28.84|78.77
Mysuru|Karnataka|12.30|76.64
Gurugram|Haryana|28.46|77.03
Aligarh|Uttar Pradesh|27.88|78.08
Jalandhar|Punjab|31.33|75.58
Tiruchirappalli|Tamil Nadu|10.79|78.70
Bhubaneswar|Odisha|20.30|85.82
Salem|Tamil Nadu|11.66|78.15
Mira Bhayandar|Maharashtra|19.29|72.85
Thiruvananthapuram|Kerala|8.52|76.94
Bhiwandi|Maharashtra|19.30|73.06
Saharanpur|Uttar Pradesh|29.96|77.55
Gorakhpur|Uttar Pradesh|26.76|83.37
Guntur|Andhra Pradesh|16.31|80.44
Bikaner|Rajasthan|28.02|73.31
Amravati|Maharashtra|20.93|77.75
Noida|Uttar Pradesh|28.54|77.39
Greater Noida|Uttar Pradesh|28.47|77.50
Jamshedpur|Jharkhand|22.80|86.20
Bhilai|Chhattisgarh|21.21|81.38
Cuttack|Odisha|20.46|85.88
Firozabad|Uttar Pradesh|27.15|78.40
Kochi|Kerala|9.93|76.27
Nellore|Andhra Pradesh|14.44|79.99
Bhavnagar|Gujarat|21.76|72.15
Dehradun|Uttarakhand|30.32|78.03
Durgapur|West Bengal|23.52|87.31
Asansol|West Bengal|23.68|86.98
Rourkela|Odisha|22.26|84.85
Nanded|Maharashtra|19.14|77.32
Kolhapur|Maharashtra|16.70|74.24
Ajmer|Rajasthan|26.45|74.64
Akola|Maharashtra|20.70|77.00
Gulbarga|Karnataka|17.33|76.83
Jamnagar|Gujarat|22.47|70.06
Ujjain|Madhya Pradesh|23.18|75.78
Loni|Uttar Pradesh|28.75|77.29
Siliguri|West Bengal|26.73|88.40
Jhansi|Uttar Pradesh|25.45|78.57
Ulhasnagar|Maharashtra|19.22|73.16
Jammu|Jammu and Kashmir|32.73|74.86
Sangli|Maharashtra|16.85|74.58
Mangaluru|Karnataka|12.91|74.86
Erode|Tamil Nadu|11.34|77.72
Belagavi|Karnataka|15.85|74.50
Ambattur|Tamil Nadu|13.11|80.16
Tirunelveli|Tamil Nadu|8.71|77.76
Malegaon|Maharashtra|20.55|74.53
Gaya|Bihar|24.80|85.00
Udaipur|Rajasthan|24.59|73.71
Kozhikode|Kerala|11.26|75.78
Thrissur|Kerala|10.53|76.21
Kollam|Kerala|8.89|76.61
Kannur|Kerala|11.87|75.37
Palakkad|Kerala|10.79|76.65
Alappuzha|Kerala|9.50|76.34
Kottayam|Kerala|9.59|76.52
Malappuram|Kerala|11.07|76.07
Davanagere|Karnataka|14.46|75.92
Ballari|Karnataka|15.14|76.92
Shivamogga|Karnataka|13.93|75.57
Tumakuru|Karnataka|13.34|77.10
Udupi|Karnataka|13.34|74.75
Vijayapura|Karnataka|16.83|75.71
Raichur|Karnataka|16.20|77.36
Hassan|Karnataka|13.01|76.10
Kurnool|Andhra Pradesh|15.83|78.04
Kakinada|Andhra Pradesh|16.99|82.25
Rajahmundry|Andhra Pradesh|17.00|81.80
Tirupati|Andhra Pradesh|13.63|79.42
Anantapur|Andhra Pradesh|14.68|77.60
Kadapa|Andhra Pradesh|14.47|78.82
Eluru|Andhra Pradesh|16.71|81.10
Ongole|Andhra Pradesh|15.50|80.05
Vizianagaram|Andhra Pradesh|18.11|83.40
Srikakulam|Andhra Pradesh|18.30|83.90
Amaravati|Andhra Pradesh|16.57|80.36
Warangal|Telangana|17.97|79.59
Karimnagar|Telangana|18.44|79.13
Nizamabad|Telangana|18.67|78.09
Khammam|Telangana|17.25|80.15
Secunderabad|Telangana|17.44|78.50
Vellore|Tamil Nadu|12.92|79.13
Thanjavur|Tamil Nadu|10.79|79.14
Tiruppur|Tamil Nadu|11.11|77.34
Thoothukudi|Tamil Nadu|8.76|78.13
Dindigul|Tamil Nadu|10.36|77.98
Kanchipuram|Tamil Nadu|12.83|79.70
Nagercoil|Tamil Nadu|8.18|77.41
Kumbakonam|Tamil Nadu|10.96|79.38
Hosur|Tamil Nadu|12.74|77.83
Karur|Tamil Nadu|10.96|78.08
Rameswaram|Tamil Nadu|9.29|79.31
Ooty|Tamil Nadu|11.41|76.70
Puducherry|Puducherry|11.94|79.81
Port Blair|Andaman and Nicobar|11.62|92.73
Kavaratti|Lakshadweep|10.57|72.64
Panaji|Goa|15.49|73.83
Margao|Goa|15.27|73.96
Vasco da Gama|Goa|15.40|73.81
Surat|Gujarat|21.17|72.83
Gandhinagar|Gujarat|23.22|72.65
Junagadh|Gujarat|21.52|70.46
Anand|Gujarat|22.56|72.95
Bharuch|Gujarat|21.71|72.98
Navsari|Gujarat|20.95|72.92
Valsad|Gujarat|20.59|72.93
Mehsana|Gujarat|23.60|72.39
Morbi|Gujarat|22.81|70.84
Porbandar|Gujarat|21.64|69.61
Bhuj|Gujarat|23.24|69.67
Dwarka|Gujarat|22.24|68.97
Somnath|Gujarat|20.89|70.40
Palanpur|Gujarat|24.17|72.43
Godhra|Gujarat|22.78|73.61
Daman|Dadra and Nagar Haveli and Daman and Diu|20.40|72.83
Silvassa|Dadra and Nagar Haveli and Daman and Diu|20.27|73.01
Alwar|Rajasthan|27.55|76.60
Bhilwara|Rajasthan|25.35|74.63
Sikar|Rajasthan|27.61|75.14
Pali|Rajasthan|25.77|73.32
Bharatpur|Rajasthan|27.22|77.49
Sri Ganganagar|Rajasthan|29.90|73.88
Jhunjhunu|Rajasthan|28.13|75.40
Chittorgarh|Rajasthan|24.88|74.62
Barmer|Rajasthan|25.75|71.39
Jaisalmer|Rajasthan|26.92|70.91
Tonk|Rajasthan|26.17|75.79
Nagaur|Rajasthan|27.20|73.73
Pushkar|Rajasthan|26.49|74.55
Mount Abu|Rajasthan|24.59|72.71
Sawai Madhopur|Rajasthan|26.02|76.35
Ratlam|Madhya Pradesh|23.33|75.04
Sagar|Madhya Pradesh|23.84|78.74
Dewas|Madhya Pradesh|22.97|76.05
Satna|Madhya Pradesh|24.58|80.83
Rewa|Madhya Pradesh|24.53|81.30
Murwara (Katni)|Madhya Pradesh|23.83|80.39
Singrauli|Madhya Pradesh|24.20|82.67
Burhanpur|Madhya Pradesh|21.31|76.23
Khandwa|Madhya Pradesh|21.83|76.35
Chhindwara|Madhya Pradesh|22.06|78.94
Vidisha|Madhya Pradesh|23.52|77.81
Morena|Madhya Pradesh|26.50|78.00
Guna|Madhya Pradesh|24.65|77.31
Shivpuri|Madhya Pradesh|25.42|77.66
Mandsaur|Madhya Pradesh|24.07|75.07
Omkareshwar|Madhya Pradesh|22.25|76.15
Chitrakoot|Madhya Pradesh|25.20|80.90
Bilaspur|Chhattisgarh|22.08|82.15
Korba|Chhattisgarh|22.36|82.75
Durg|Chhattisgarh|21.19|81.28
Rajnandgaon|Chhattisgarh|21.10|81.03
Jagdalpur|Chhattisgarh|19.08|82.02
Ambikapur|Chhattisgarh|23.12|83.20
Bokaro|Jharkhand|23.67|86.15
Deoghar|Jharkhand|24.48|86.70
Hazaribagh|Jharkhand|23.99|85.36
Giridih|Jharkhand|24.19|86.30
Dumka|Jharkhand|24.27|87.25
Bhagalpur|Bihar|25.24|86.98
Muzaffarpur|Bihar|26.12|85.39
Darbhanga|Bihar|26.15|85.90
Purnia|Bihar|25.78|87.47
Arrah|Bihar|25.56|84.66
Begusarai|Bihar|25.42|86.13
Katihar|Bihar|25.54|87.58
Munger|Bihar|25.38|86.47
Chhapra|Bihar|25.78|84.73
Sasaram|Bihar|24.95|84.03
Hajipur|Bihar|25.69|85.21
Motihari|Bihar|26.65|84.92
Sitamarhi|Bihar|26.59|85.49
Bodh Gaya|Bihar|24.70|84.99
Nalanda|Bihar|25.14|85.44
Siwan|Bihar|26.22|84.36
Bettiah|Bihar|26.80|84.50
Ayodhya|Uttar Pradesh|26.80|82.20
Mathura|Uttar Pradesh|27.49|77.67
Vrindavan|Uttar Pradesh|27.58|77.70
Muzaffarnagar|Uttar Pradesh|29.47|77.70
Shahjahanpur|Uttar Pradesh|27.88|79.91
Rampur|Uttar Pradesh|28.80|79.03
Mirzapur|Uttar Pradesh|25.15|82.57
Jaunpur|Uttar Pradesh|25.75|82.69
Azamgarh|Uttar Pradesh|26.07|83.18
Ballia|Uttar Pradesh|25.76|84.15
Basti|Uttar Pradesh|26.80|82.73
Gonda|Uttar Pradesh|27.13|81.96
Bahraich|Uttar Pradesh|27.57|81.60
Sitapur|Uttar Pradesh|27.57|80.68
Hardoi|Uttar Pradesh|27.40|80.13
Unnao|Uttar Pradesh|26.55|80.49
Rae Bareli|Uttar Pradesh|26.23|81.23
Sultanpur|Uttar Pradesh|26.26|82.07
Etawah|Uttar Pradesh|26.78|79.02
Mainpuri|Uttar Pradesh|27.23|79.02
Farrukhabad|Uttar Pradesh|27.39|79.58
Banda|Uttar Pradesh|25.48|80.33
Fatehpur|Uttar Pradesh|25.93|80.81
Pratapgarh|Uttar Pradesh|25.90|81.95
Deoria|Uttar Pradesh|26.50|83.78
Ghazipur|Uttar Pradesh|25.58|83.58
Bulandshahr|Uttar Pradesh|28.40|77.85
Hapur|Uttar Pradesh|28.73|77.78
Bijnor|Uttar Pradesh|29.37|78.13
Lakhimpur|Uttar Pradesh|27.95|80.78
Lalitpur|Uttar Pradesh|24.69|78.41
Orai|Uttar Pradesh|25.99|79.45
Badaun|Uttar Pradesh|28.03|79.12
Pilibhit|Uttar Pradesh|28.63|79.80
Haridwar|Uttarakhand|29.95|78.16
Rishikesh|Uttarakhand|30.09|78.27
Haldwani|Uttarakhand|29.22|79.51
Roorkee|Uttarakhand|29.87|77.89
Rudrapur|Uttarakhand|28.98|79.40
Nainital|Uttarakhand|29.38|79.46
Almora|Uttarakhand|29.60|79.66
Kashipur|Uttarakhand|29.21|78.96
Pithoragarh|Uttarakhand|29.58|80.22
Shimla|Himachal Pradesh|31.10|77.17
Dharamshala|Himachal Pradesh|32.22|76.32
Mandi|Himachal Pradesh|31.71|76.93
Solan|Himachal Pradesh|30.90|77.10
Kullu|Himachal Pradesh|31.96|77.11
Manali|Himachal Pradesh|32.24|77.19
Hamirpur (HP)|Himachal Pradesh|31.69|76.52
Una|Himachal Pradesh|31.47|76.27
Bilaspur (HP)|Himachal Pradesh|31.34|76.76
Chamba|Himachal Pradesh|32.55|76.13
Leh|Ladakh|34.15|77.58
Kargil|Ladakh|34.56|76.13
Anantnag|Jammu and Kashmir|33.73|75.15
Baramulla|Jammu and Kashmir|34.20|74.34
Udhampur|Jammu and Kashmir|32.92|75.14
Kathua|Jammu and Kashmir|32.37|75.52
Katra|Jammu and Kashmir|32.99|74.93
Patiala|Punjab|30.34|76.39
Bathinda|Punjab|30.21|74.95
Mohali|Punjab|30.70|76.72
Pathankot|Punjab|32.27|75.65
Hoshiarpur|Punjab|31.53|75.91
Moga|Punjab|30.82|75.17
Firozpur|Punjab|30.93|74.61
Batala|Punjab|31.82|75.20
Kapurthala|Punjab|31.38|75.38
Sangrur|Punjab|30.25|75.84
Barnala|Punjab|30.38|75.55
Khanna|Punjab|30.70|76.22
Phagwara|Punjab|31.22|75.77
Rajpura|Punjab|30.48|76.59
Panipat|Haryana|29.39|76.97
Ambala|Haryana|30.38|76.78
Yamunanagar|Haryana|30.13|77.29
Rohtak|Haryana|28.90|76.61
Hisar|Haryana|29.15|75.72
Karnal|Haryana|29.69|76.99
Sonipat|Haryana|28.99|77.02
Panchkula|Haryana|30.69|76.86
Bhiwani|Haryana|28.79|76.13
Sirsa|Haryana|29.53|75.03
Kurukshetra|Haryana|29.97|76.88
Rewari|Haryana|28.20|76.62
Jind|Haryana|29.32|76.31
Kaithal|Haryana|29.80|76.40
Palwal|Haryana|28.14|77.33
Bahadurgarh|Haryana|28.69|76.93
Nashik Road|Maharashtra|19.95|73.84
Jalgaon|Maharashtra|21.01|75.56
Ahmednagar|Maharashtra|19.09|74.74
Latur|Maharashtra|18.40|76.57
Dhule|Maharashtra|20.90|74.77
Chandrapur|Maharashtra|19.96|79.30
Parbhani|Maharashtra|19.27|76.77
Ichalkaranji|Maharashtra|16.69|74.46
Jalna|Maharashtra|19.84|75.88
Bhusawal|Maharashtra|21.05|75.79
Panvel|Maharashtra|18.99|73.12
Satara|Maharashtra|17.68|74.00
Beed|Maharashtra|18.99|75.76
Yavatmal|Maharashtra|20.39|78.12
Kalyan|Maharashtra|19.24|73.13
Vasai-Virar|Maharashtra|19.39|72.84
Wardha|Maharashtra|20.75|78.60
Ratnagiri|Maharashtra|16.99|73.31
Osmanabad|Maharashtra|18.19|76.04
Gondia|Maharashtra|21.46|80.19
Shirdi|Maharashtra|19.77|74.48
Pandharpur|Maharashtra|17.68|75.33
Lonavala|Maharashtra|18.75|73.41
Baramati|Maharashtra|18.15|74.58
Pimpri-Chinchwad|Maharashtra|18.63|73.80
Berhampur|Odisha|19.31|84.79
Sambalpur|Odisha|21.47|83.97
Puri|Odisha|19.81|85.83
Balasore|Odisha|21.49|86.93
Baripada|Odisha|21.93|86.73
Bhadrak|Odisha|21.06|86.50
Jharsuguda|Odisha|21.86|84.01
Konark|Odisha|19.89|86.09
Kharagpur|West Bengal|22.33|87.32
Bardhaman|West Bengal|23.23|87.86
Malda|West Bengal|25.00|88.14
Haldia|West Bengal|22.06|88.07
Krishnanagar|West Bengal|23.40|88.50
Darjeeling|West Bengal|27.04|88.26
Jalpaiguri|West Bengal|26.54|88.72
Baharampur|West Bengal|24.10|88.25
Bankura|West Bengal|23.23|87.07
Midnapore|West Bengal|22.42|87.32
Cooch Behar|West Bengal|26.32|89.45
Barasat|West Bengal|22.72|88.48
Serampore|West Bengal|22.75|88.34
Shantiniketan|West Bengal|23.68|87.68
Silchar|Assam|24.83|92.78
Dibrugarh|Assam|27.47|94.91
Jorhat|Assam|26.75|94.22
Nagaon|Assam|26.35|92.68
Tezpur|Assam|26.63|92.80
Tinsukia|Assam|27.49|95.36
Dispur|Assam|26.14|91.79
Bongaigaon|Assam|26.48|90.56
Shillong|Meghalaya|25.58|91.89
Tura|Meghalaya|25.51|90.22
Imphal|Manipur|24.82|93.94
Aizawl|Mizoram|23.73|92.72
Kohima|Nagaland|25.67|94.11
Dimapur|Nagaland|25.91|93.73
Agartala|Tripura|23.83|91.29
Itanagar|Arunachal Pradesh|27.08|93.61
Tawang|Arunachal Pradesh|27.59|91.86
Gangtok|Sikkim|27.33|88.61
Namchi|Sikkim|27.17|88.36
Kalimpong|West Bengal|27.06|88.47
Hubli|Karnataka|15.35|75.14
Bidar|Karnataka|17.91|77.52
Mandya|Karnataka|12.52|76.90
Chikkamagaluru|Karnataka|13.32|75.77
Kolar|Karnataka|13.14|78.13
Gadag|Karnataka|15.43|75.63
Chitradurga|Karnataka|14.23|76.40
Karwar|Karnataka|14.81|74.13
Hospet|Karnataka|15.27|76.39
Bagalkot|Karnataka|16.18|75.70
Mahbubnagar|Telangana|16.74|78.00
Nalgonda|Telangana|17.05|79.27
Adilabad|Telangana|19.67|78.53
Suryapet|Telangana|17.14|79.62
Siddipet|Telangana|18.10|78.85
Ramagundam|Telangana|18.76|79.47
Machilipatnam|Andhra Pradesh|16.19|81.14
Chittoor|Andhra Pradesh|13.22|79.10
Proddatur|Andhra Pradesh|14.75|78.55
Nandyal|Andhra Pradesh|15.48|78.48
Hindupur|Andhra Pradesh|13.83|77.49
Tenali|Andhra Pradesh|16.24|80.64
Bhimavaram|Andhra Pradesh|16.54|81.52
Srisailam|Andhra Pradesh|16.07|78.87
Kanyakumari|Tamil Nadu|8.08|77.54
Cuddalore|Tamil Nadu|11.75|79.75
Sivakasi|Tamil Nadu|9.45|77.80
Pollachi|Tamil Nadu|10.66|77.01
Namakkal|Tamil Nadu|11.22|78.17
Tiruvannamalai|Tamil Nadu|12.23|79.07
Chidambaram|Tamil Nadu|11.40|79.69
Nagapattinam|Tamil Nadu|10.77|79.84
Virudhunagar|Tamil Nadu|9.58|77.96
Pudukkottai|Tamil Nadu|10.38|78.82
Krishnagiri|Tamil Nadu|12.52|78.21
Kodaikanal|Tamil Nadu|10.24|77.49
Pathanamthitta|Kerala|9.26|76.79
Kasaragod|Kerala|12.50|74.99
Idukki|Kerala|9.85|76.97
Guruvayur|Kerala|10.59|76.04
Sabarimala|Kerala|9.43|77.08
Wayanad (Kalpetta)|Kerala|11.61|76.08
Varkala|Kerala|8.73|76.71`;

// name|country|lat|lon|tz
const WORLD = `Kathmandu|Nepal|27.72|85.32|Asia/Kathmandu
Pokhara|Nepal|28.21|83.99|Asia/Kathmandu
Dhaka|Bangladesh|23.81|90.41|Asia/Dhaka
Chittagong|Bangladesh|22.36|91.78|Asia/Dhaka
Karachi|Pakistan|24.86|67.01|Asia/Karachi
Lahore|Pakistan|31.55|74.34|Asia/Karachi
Islamabad|Pakistan|33.68|73.05|Asia/Karachi
Colombo|Sri Lanka|6.93|79.86|Asia/Colombo
Thimphu|Bhutan|27.47|89.64|Asia/Thimphu
Male|Maldives|4.18|73.51|Indian/Maldives
Dubai|United Arab Emirates|25.20|55.27|Asia/Dubai
Abu Dhabi|United Arab Emirates|24.45|54.38|Asia/Dubai
Sharjah|United Arab Emirates|25.35|55.42|Asia/Dubai
Muscat|Oman|23.59|58.41|Asia/Muscat
Doha|Qatar|25.29|51.53|Asia/Qatar
Kuwait City|Kuwait|29.38|47.99|Asia/Kuwait
Riyadh|Saudi Arabia|24.71|46.68|Asia/Riyadh
Jeddah|Saudi Arabia|21.49|39.19|Asia/Riyadh
Manama|Bahrain|26.23|50.59|Asia/Bahrain
Singapore|Singapore|1.35|103.82|Asia/Singapore
Kuala Lumpur|Malaysia|3.14|101.69|Asia/Kuala_Lumpur
Bangkok|Thailand|13.76|100.50|Asia/Bangkok
Jakarta|Indonesia|-6.21|106.85|Asia/Jakarta
Bali (Denpasar)|Indonesia|-8.65|115.22|Asia/Makassar
Hong Kong|China|22.32|114.17|Asia/Hong_Kong
Shanghai|China|31.23|121.47|Asia/Shanghai
Beijing|China|39.90|116.41|Asia/Shanghai
Tokyo|Japan|35.68|139.69|Asia/Tokyo
Seoul|South Korea|37.57|126.98|Asia/Seoul
Manila|Philippines|14.60|120.98|Asia/Manila
Yangon|Myanmar|16.84|96.17|Asia/Yangon
London|United Kingdom|51.51|-0.13|Europe/London
Birmingham|United Kingdom|52.49|-1.89|Europe/London
Leicester|United Kingdom|52.64|-1.13|Europe/London
Manchester|United Kingdom|53.48|-2.24|Europe/London
Edinburgh|United Kingdom|55.95|-3.19|Europe/London
Dublin|Ireland|53.35|-6.26|Europe/Dublin
Paris|France|48.86|2.35|Europe/Paris
Berlin|Germany|52.52|13.40|Europe/Berlin
Frankfurt|Germany|50.11|8.68|Europe/Berlin
Amsterdam|Netherlands|52.37|4.90|Europe/Amsterdam
Zurich|Switzerland|47.38|8.54|Europe/Zurich
Rome|Italy|41.90|12.50|Europe/Rome
Madrid|Spain|40.42|-3.70|Europe/Madrid
Stockholm|Sweden|59.33|18.07|Europe/Stockholm
Moscow|Russia|55.76|37.62|Europe/Moscow
Istanbul|Turkey|41.01|28.98|Europe/Istanbul
Nairobi|Kenya|-1.29|36.82|Africa/Nairobi
Johannesburg|South Africa|-26.20|28.05|Africa/Johannesburg
Durban|South Africa|-29.86|31.02|Africa/Johannesburg
Port Louis|Mauritius|-20.16|57.50|Indian/Mauritius
Lagos|Nigeria|6.52|3.38|Africa/Lagos
Cairo|Egypt|30.04|31.24|Africa/Cairo
New York|United States|40.71|-74.01|America/New_York
New Jersey (Edison)|United States|40.52|-74.41|America/New_York
Washington DC|United States|38.91|-77.04|America/New_York
Boston|United States|42.36|-71.06|America/New_York
Atlanta|United States|33.75|-84.39|America/New_York
Chicago|United States|41.88|-87.63|America/Chicago
Houston|United States|29.76|-95.37|America/Chicago
Dallas|United States|32.78|-96.80|America/Chicago
Denver|United States|39.74|-104.99|America/Denver
Phoenix|United States|33.45|-112.07|America/Phoenix
Los Angeles|United States|34.05|-118.24|America/Los_Angeles
San Francisco|United States|37.77|-122.42|America/Los_Angeles
San Jose|United States|37.34|-121.89|America/Los_Angeles
Seattle|United States|47.61|-122.33|America/Los_Angeles
Toronto|Canada|43.65|-79.38|America/Toronto
Brampton|Canada|43.73|-79.76|America/Toronto
Montreal|Canada|45.50|-73.57|America/Toronto
Vancouver|Canada|49.28|-123.12|America/Vancouver
Calgary|Canada|51.05|-114.07|America/Edmonton
Mexico City|Mexico|19.43|-99.13|America/Mexico_City
Sao Paulo|Brazil|-23.55|-46.63|America/Sao_Paulo
Port of Spain|Trinidad and Tobago|10.66|-61.51|America/Port_of_Spain
Georgetown|Guyana|6.80|-58.16|America/Guyana
Paramaribo|Suriname|5.85|-55.20|America/Paramaribo
Suva|Fiji|-18.14|178.44|Pacific/Fiji
Sydney|Australia|-33.87|151.21|Australia/Sydney
Melbourne|Australia|-37.81|144.96|Australia/Melbourne
Brisbane|Australia|-27.47|153.03|Australia/Brisbane
Perth|Australia|-31.95|115.86|Australia/Perth
Adelaide|Australia|-34.93|138.60|Australia/Adelaide
Auckland|New Zealand|-36.85|174.76|Pacific/Auckland`;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const CITIES: City[] = [
  ...INDIA.split('\n').map((l) => {
    const [name, region, lat, lon] = l.split('|');
    return { id: slug(`${name}-${region}`), name, region, lat: +lat, lon: +lon, tz: 'Asia/Kolkata' };
  }),
  ...WORLD.split('\n').map((l) => {
    const [name, region, lat, lon, tz] = l.split('|');
    return { id: slug(`${name}-${region}`), name, region, lat: +lat, lon: +lon, tz };
  }),
];

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));
export const cityById = (id?: string | null) => (id ? BY_ID.get(id) : undefined);
export const DEFAULT_CITY = BY_ID.get('new-delhi-delhi')!;

export function searchCities(q: string, limit = 8): City[] {
  const s = q.trim().toLowerCase();
  if (!s) return CITIES.slice(0, limit);
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const n = c.name.toLowerCase();
    if (n.startsWith(s)) starts.push(c);
    else if (n.includes(s) || c.region.toLowerCase().startsWith(s)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

export const cityLabel = (c: City) => `${c.name}, ${c.region}`;
