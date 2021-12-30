//== API
const API_KEY = 'daa03fdcd151c847dbb9e1008f179e84'
const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_IMG_URL = 'https://image.tmdb.org/t/p/w500'

const movieAPI = {
  latest_movies_url: API_BASE_URL + '/movie/now_playing?api_key=' + API_KEY + '&language=en-US&page=1',
  search_movies_url: API_BASE_URL + '/search/movie?api_key=' + API_KEY + '&language=en-US&page=1',
  top_movies_url: API_BASE_URL + '/movie/top_rated?api_key=' + API_KEY + '&language=en-US&page=1',
}

//== page elements
const BODY = document.body
const MOVIES_FORM = document.querySelector('.form-search')
const MOVIES_FORM_INPUT = document.querySelector('#txtSearchInput')
const MOVIES_LIST_INFO = document.querySelector('.section-results-info')
const MOVIES_LIST_EL = document.querySelector('.card-container')
const MOVIES_TOTAL_RESULTS = document.querySelector('.results-total')
const MOVIES_PAGE_PREV = document.querySelector('#cmdPrev')
const MOVIES_PAGE_NEXT = document.querySelector('#cmdNext')
const MOVIES_PAGE_INFO = document.querySelector('.results-page-info')
const MOVIES_PAGER = document.querySelector('.block-pager')
const MOVIES_ERR_EL = document.querySelector('.section-error')
const MOVIES_ERR_MSG = document.querySelector('.section-error-message')
const MOVIE_PANEL = document.querySelector('.panel-movie-info')
const MOVIE_PANEL_DETAILS = document.querySelector('.panel-details')
const MOVIE_CLOSE = document.querySelector('.btn-close')
const MOVIE_HERO = document.querySelector('.content-hero')
const MOVIE_HERO_IMG = document.querySelector('#divHeroImg')
const MOVIE_BTN_TOP = document.querySelector('.btn-toprated')

//== variables for pagination
let TOTAL_PAGES = 1
let ACTIVE_PAGE = 1
let ACTIVE_SEARCH_URL = ''

//== reusable fetch function
const getJSON = (url, errorMsg) => {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${errorMsg} - ${response.status}`)
    return response.json()
  })
}

//== get the movies data based on the URL passed
const getMoviesList = async (URL) => {
  ACTIVE_SEARCH_URL = URL
  MOVIES_ERR_EL.style.display = 'none'
  MOVIES_LIST_INFO.style.display = 'flex'

  await getJSON(URL, 'Movie List - cannot get the movie list')
    .then((data) => {
      //== render the movies list
      renderMovieList(data.results)

      //== handle paging
      ACTIVE_PAGE = data.page
      TOTAL_PAGES = data.total_pages
      let totalResults = data.total_results

      MOVIES_TOTAL_RESULTS.innerHTML = totalResults
      totalResults === 0 ? (MOVIES_PAGER.style.display = 'none') : (MOVIES_PAGER.style.display = 'flex')

      //== handle paging active state
      ACTIVE_PAGE === 1
        ? MOVIES_PAGE_PREV.classList.add('is-inactive')
        : MOVIES_PAGE_PREV.classList.remove('is-inactive')
      ACTIVE_PAGE === TOTAL_PAGES
        ? MOVIES_PAGE_NEXT.classList.add('is-inactive')
        : MOVIES_PAGE_NEXT.classList.remove('is-inactive')

      //== handle paging display
      MOVIES_PAGE_INFO.innerHTML = 'Page ' + ACTIVE_PAGE + ' of ' + TOTAL_PAGES
    })
    .catch((err) => {
      renderError(err.message)
    })
}

//== build and render the grid of films
const renderMovieList = (movieListData) => {
  let output = ''

  MOVIE_HERO.style.display = 'none'
  movieListData.forEach((movie, index) => {
    const { id, title, release_date, poster_path } = movie
    const yearRelease = getYear(release_date)
    const posterImg = poster_path != null ? API_IMG_URL + '/' + poster_path : 'assets/main/img/layout/empty-poster.jpg'

    if (index === 0) {
      renderHeroMovie(movie)
    }

    output += `
			<div class="cell">
				<a href="" class="card-movie" onclick="movieHandler(${id}, event)">
					<span class="img" style="background-image:url(${posterImg});"></span>
					<span class="info">
						<span class="title">${title}</span>
						<span class="year">${yearRelease}</span>
					</span>
				</a>
			</div> 
    `
  })

  //== add the output to the page element
  MOVIES_LIST_EL.innerHTML = ''
  MOVIES_LIST_EL.insertAdjacentHTML('beforeend', output)
}

//== build and render the movie info panel
const renderMovie = (details, credits) => {
  const { title, overview, backdrop_path, vote_average, release_date, genres, imdb_id, runtime } = details
  const yearRelease = getYear(release_date)

  //== get the specific genre data
  const genreData = genres.map((item) => {
    return item.name
  })

  //== get the specific directors data
  const directors = credits.crew.filter((item) => {
    return item.job === 'Director'
  })

  //== get the specific cast data
  const cast = credits.cast.map((item) => {
    if (item.known_for_department === 'Acting') return item.name
  })

  let movieSpecifics = ''
  let creditDirs = []
  let creditCast = cast.slice(0, 3) //== top 3 cast members only

  directors.forEach((item) => {
    creditDirs.push(item.name)
  })

  if (creditDirs.length > 0) movieSpecifics += '<li><strong>Director</strong>: ' + creditDirs.join(', ') + '</li>'
  if (creditCast.length > 0) movieSpecifics += '<li><strong>Cast</strong>: ' + creditCast.join(', ') + '</li>'
  if (genreData.length > 0) movieSpecifics += '<li><strong>Genre</strong>: ' + genreData.join(', ') + '</li>'

  const posterImg = backdrop_path != null ? API_IMG_URL + backdrop_path : 'assets/main/img/layout/empty-back.jpg'

  let output = ''
  output += `
		<h3 class="movie-title">${title}</h3>
		<p class="movie-release">${yearRelease} | ${runtime} mins</p>
		<div class="movie-img" style="background-image:url('${posterImg}');"></div>
		<div class="movie-teaser">
			<p>${truncateString(overview, 500)}</p>
			<ul>
				${movieSpecifics}
				<li><strong>IMDB rating</strong>: ${vote_average}/10 | <a target="_blank" href="https://www.imdb.com/title/${imdb_id}/">read more on IMDB <span class="mmt-icon-imdb"></span></a></li>
			</ul>
		</div>			
   `

  //== add the output to the page element
  BODY.classList.add('oflow')
  MOVIE_PANEL_DETAILS.innerHTML = ''
  MOVIE_PANEL_DETAILS.insertAdjacentHTML('beforeend', output)
  MOVIE_PANEL.classList.add('is-open')
}

//== show her content based on each list
const renderHeroMovie = (movie) => {
  let output = ''
  const { title, release_date, backdrop_path, overview } = movie
  const yearRelease = getYear(release_date)
  const imgBackground = backdrop_path != null ? API_IMG_URL + backdrop_path : 'assets/main/img/layout/empty-back.jpg'

  output = `
		<p class="highlite">List highlite</p>
		<h1>${title}</h1>
		<p class="info">${truncateString(overview, 165)}</p>
		<p class="date">Released: ${yearRelease}</p>
	`
  MOVIE_HERO_IMG.style.backgroundImage = 'url("' + imgBackground + '")'
  MOVIE_HERO.innerHTML = ''
  MOVIE_HERO.insertAdjacentHTML('beforeend', output)
  MOVIE_HERO.style.display = 'block'
}

//== handle movie card click / display
const movieHandler = (movieID, e) => {
  e.preventDefault()

  const movieCreditsURL = API_BASE_URL + '/movie/' + movieID + '/credits?api_key=' + API_KEY + '&language=en-US'
  const movieURL = API_BASE_URL + '/movie/' + movieID + '?api_key=' + API_KEY + '&language=en-US'

  Promise.all([
    getJSON(movieCreditsURL, 'Movie Credits - cannot get the credits'),
    getJSON(movieURL, 'Movie Info - cannot get the movie information'),
  ]).then(([credits, details]) => {
    renderMovie(details, credits)
  })
}

//== handle error outputs
const renderError = (errorMessage) => {
  MOVIES_ERR_MSG.innerHTML = errorMessage
  MOVIES_ERR_EL.style.display = 'flex'
  MOVIES_LIST_INFO.style.display = 'none'
  console.log(errorMessage)
}

//== updates a QS paramter based on URL, Key, and Value
const updateQSParameter = (url, key, value) => {
  let re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i')
  let sep = url.indexOf('?') !== -1 ? '&' : '?'
  if (url.match(re)) {
    return url.replace(re, '$1' + key + '=' + value + '$2')
  } else {
    return url + sep + key + '=' + value
  }
}

//== update the page QS parameter with the new page, and fetch the movie list
const handlePaging = (newpage) => {
  let url = updateQSParameter(ACTIVE_SEARCH_URL, 'page', newpage)
  getMoviesList(url)
}

//== return the release year from a date string
const getYear = (date) => {
  const dtRelease = new Date(date)
  const yearRelease = dtRelease.getFullYear()
  return yearRelease
}

//== truncate a string based on length required
const truncateString = (s, n) => {
  return s.length > n ? s.substr(0, n - 1) + '&hellip;' : s
}

//== close the info panel
const closePanel = () => {
  MOVIE_PANEL.classList.remove('is-open')
  BODY.classList.remove('oflow')
}

//== EVENTS
//== search form submit event
MOVIES_FORM.addEventListener('submit', (e) => {
  e.preventDefault()

  let inputText = MOVIES_FORM_INPUT.value.trim()
  MOVIES_FORM_INPUT.value = ''
  MOVIE_BTN_TOP.classList.remove('is-active')

  if (inputText) {
    //== get the films based on search
    getMoviesList(movieAPI.search_movies_url + '&query=' + inputText)
  } else {
    //== get the latest films
    getMoviesList(movieAPI.latest_movies_url)
  }
})

//== next page click event
MOVIES_PAGE_NEXT.addEventListener('click', (e) => {
  e.preventDefault()

  let nextPage = (ACTIVE_PAGE += 1)

  if (nextPage <= TOTAL_PAGES) {
    handlePaging(nextPage)
  }
})

//== previous page click event
MOVIES_PAGE_PREV.addEventListener('click', (e) => {
  e.preventDefault()

  let prevPage = (ACTIVE_PAGE -= 1)

  if (prevPage >= 1) {
    handlePaging(prevPage)
  }
})

//== close panel click event
MOVIE_CLOSE.addEventListener('click', (e) => {
  e.preventDefault()
  closePanel()
})

MOVIE_BTN_TOP.addEventListener('click', (e) => {
  e.preventDefault()
  getMoviesList(movieAPI.top_movies_url)
  MOVIE_BTN_TOP.classList.add('is-active')
})

//== document click event (to close panel)
document.addEventListener('click', (e) => {
  if (!e.target.closest('.panel-movie-info .content')) closePanel()
})

//== get the latest films on initial load
;(() => {
  getMoviesList(movieAPI.latest_movies_url)
})()
