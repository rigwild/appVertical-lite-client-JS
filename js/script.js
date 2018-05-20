/*Login details to change*/
const user = "testazerty"
const pass = "testazerty"

//Bypass Cross Origin Policy
const corsProxy = "https://cors-anywhere.herokuapp.com/"

const apiBaseUrl = "https://api.appvertical.com/api/"


const log = (...ele) => ele.forEach(x => console.log(x))


/********** Get the data **********/

const reqAPI = (apiUrl, httpMethod, dataParam, headersParam) => {
	return new Promise((resolve, reject) => {
		let request = $.ajax({
			url: corsProxy + apiBaseUrl + apiUrl,
			method: httpMethod || "GET",
			data: dataParam || {},
			headers: headersParam || {}
		})
		request.done(msg => resolve(msg))
		request.fail((jqXHR, textStatus) => reject(jqXHR.responseJSON))
	})
}

const reqLogin = (vusername, vpassword) => {
	if (!vusername || !vpassword)
		return

	$("#seriesLocation").html("Logging in ...")

	const token = sessionStorage.getItem("token")
	if (token && token !== "")
		return new Promise(res => res(token))

	const dataParam = {
		login: vusername,
		password: vpassword
	}
	return reqAPI("login/authenticate", "POST", dataParam)
}

const reqGetHome = authToken => {
	if (!authToken)
		return

	const videos = sessionStorage.getItem("videos")
	if (videos && videos !== "")
		return new Promise(res => res(JSON.parse(videos)))

	const headersParam = {
		"X-Access-Token": authToken
	}
	return reqAPI("playlists?page=1&limit=9999999", "GET", null, headersParam)
}

const reqGetAllVideos = authToken => {
	if (!authToken)
		return
	const headersParam = {
		"X-Access-Token": authToken
	}
	return reqAPI("videos?limit=9999999", "GET", null, headersParam)
}

const reqGetVideoById = (authToken, videoId) => {
	if (!authToken)
		return
	const headersParam = {
		"X-Access-Token": authToken
	}
	return reqAPI("videos/" + videoId, "GET", null, headersParam)
}



/********** Start the script **********/

const setupGetSeries = (vusername, vpassword) => {
	reqLogin(vusername, vpassword)
		.catch(e => {
			log(e)
			$("#seriesLocation").html("Error ! Cant't log in. The access token cache has been reloaded.<br>Try to refresh the page.")
			sessionStorage.clear()
			return null
		})
		.then(res => {
			if (!res)
				return
			let authToken
			if (typeof res !== 'string') {
				authToken = res.token
				sessionStorage.setItem("token", res.token)
			} else {
				authToken = res
			}
			$("#seriesLocation").html("Fetching videos from Vertical servers ...")
			reqGetHome(authToken)
				.catch(e => {
					log(e)
					$("#seriesLocation").html("Error ! Can't fetch the videos. Try to reload the page. If it still doesn't work post an issue on the Github page.")
					sessionStorage.clear()
					return null
				})
				.then(res => {
					log(res)
					if (!sessionStorage.getItem("videos"))
						sessionStorage.setItem("videos", JSON.stringify(res))
					setSeriesToPage(res.results)
				})
		})
}

const setupGetVideos = (vusername, vpassword) => {
	reqLogin(vusername, vpassword)
		.catch(e => {
			log(e)
			return null
		})
		.then(res => {
			if (!res)
				return
			let authToken = res.token
			reqGetAllVideos(authToken)
				.catch(e => {
					log(e)
					return null
				})
				.then(res => setSeriesToPage(res.results))
		})
}


const setupGetWatch = (vusername, vpassword) => {
	reqLogin(vusername, vpassword)
		.catch(e => {
			log(e)
			$("#seriesLocation").html("Error ! Cant't log in. The access token cache has been reloaded.<br>Try to refresh the page.")
			sessionStorage.clear()
			return null
		})
		.then(res => {
			if (!res)
				return
			let authToken
			if (typeof res !== 'string') {
				authToken = res.token
				sessionStorage.setItem("token", res.token)
			} else {
				authToken = res
			}
			$("#seriesLocation").html("Fetching the video from Vertical servers ...")
			let url = new URL(location.href)
			let videoId = url.searchParams.get("id")
			reqGetVideoById(authToken, videoId)
				.catch(e => {
					log(e)
					$("#seriesLocation").html("Error ! Can't fetch the videos. Try to reload the page. If it still doesn't work post an issue on the Github page.")
					sessionStorage.clear()
					return null
				})
				.then(res => setVideoToPage(res))
		})
}

const setVideoToPage = video => {
	$(".watchTitle").html(video.name)
	$("#watchThumbnailImg").attr("src", video.images.large.url)
	$("#author").html(video.user.username)
	$("#duration").html(Math.floor(video.time / 60) + video.time % 60)
	$("#likesCount").html(video.likes)
	$("#commentsCount").html(video.commentsCount)
	$("#description").html(video.description)
	$("#video").attr("src", video.hdPath)
	$("#player")[0].load()
}


const setSeriesToPage = series => {
	if (!series)
		return
	$("#seriesLocation").html("")
	series.forEach(oneSeries => {
		let oneSeriesString = `<div class='series'><span class="seriesTitle">${oneSeries.name}</span><div class='seriesVideos'>`

		oneSeries.videos.forEach(aVideo => {
			oneSeriesString += `<a href='watch.html?id=${aVideo._id}'>
					<div class='overlay'></div>
					<div class='overlayContent' id="videoName">${aVideo.name}</div>
					<img src='${aVideo.images.thumbnail.url}' /></a>`
		})
		oneSeriesString += `</div></div>`
		$("#seriesLocation").html($("#seriesLocation").html() + oneSeriesString)
	})
	initVideoStyle()
}



const initVideoStyle = () => {
	const fadeTitle = true
	const fadeTime = 200

	$(".seriesVideos a").mouseenter(function() {
		if (fadeTitle) {
			$(this).children(".overlay").fadeIn({
				queue: false,
				duration: fadeTime
			}, 'linear')
			$(this).children(".overlayContent").fadeIn({
				queue: false,
				duration: fadeTime
			}, 'linear')
		} else {
			$(this).children(".overlay").show()
			$(this).children(".overlayContent").show()
		}
	})
	$(".seriesVideos a").mouseleave(function() {
		if (fadeTitle) {
			$(this).children(".overlay").fadeOut({
				duration: fadeTime
			}, 'linear')
			$(this).children(".overlayContent").fadeOut({
				duration: fadeTime
			}, 'linear')
		} else {
			$(this).children(".overlay").hide()
			$(this).children(".overlayContent").hide()
		}
	})
}