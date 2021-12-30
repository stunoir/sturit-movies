const API_KEY = 'daa03fdcd151c847dbb9e1008f179e84';
const API_BASE_URL = 'https://api.themoviedb.org/3';

const movieSite = Vue.createApp({
  data() {
    return {
      searchInput: '',
      loaded: false,
      moviesList: [],
      totalPages: 1,
      activePage: 1,
      totalMovies: 0,
      activeURL: '',
      searchMoviesUrl: API_BASE_URL + '/search/movie?api_key=' + API_KEY + '&language=en-US&page=1',
      latestMoviesUrl: API_BASE_URL + '/movie/now_playing?api_key=' + API_KEY + '&language=en-US&page=1',
      errorOccured: false,
      imgPath: 'https://image.tmdb.org/t/p/w500/',
      modalOpen: false,
      panelTitle: '',
      panelYear: '',
      panelTeaser: '',
      panelRate: '',
      panelInfo: '',
			panelPoster: '',
			panelDir: '',
			panelCast: '',
			panelGenre: '',
			panelRuntime: '',
    };
  },
  mounted() {
    this.activeURL = this.latestMoviesUrl;
    this.getMoviesList();
  },
  methods: {
    async getJSON(url, errorMsg) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${errorMsg} - ${response.status}`);
      return await response.json();
    },

    getMoviesList() {
			this.getJSON(this.activeURL, 'Movie List - cannot get the list data')
        .then((data) => {
          this.moviesList = data.results;
          this.activePage = data.page;
          this.totalMovies = data.total_results;
          this.totalPages = data.total_pages;
          this.errorOccured = false;
        })
        .catch((err) => {
          console.error(err);
          this.errorOccured = true;
        })
        .finally(() => {
          this.loaded = true;
        });
    },

    searchMovies() {
      let inputText = this.searchInput.trim();
      if (inputText) {
        this.activeURL = this.searchMoviesUrl + '&query=' + inputText;
        this.getMoviesList();
      } else {
        this.activeURL = this.latestMoviesUrl;
        this.getMoviesList();
      }
      this.searchInput = '';
    },

    pagePrev() {
      let prevPage = this.activePage;

      prevPage--;

      if (prevPage >= 1) {
        this.handlePaging(prevPage);
      }
    },

    pageNext() {
      let nextPage = this.activePage;

      nextPage++;

      if (nextPage <= this.totalPages) {
        this.handlePaging(nextPage);
      }
    },

    handlePaging(page) {
      let url = this.updateQSParameter('page', page);
      this.activeURL = url;
      this.getMoviesList();
    },

    getYear(date) {
      const movDate = new Date(date);
      return movDate.getFullYear();
    },

    truncateString(s, n) {
      return s.length > n ? s.substr(0, n - 1) + '&hellip;' : s;
    },

    updateQSParameter(key, value) {
      let url = this.activeURL.toString();
      let re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      let sep = url.indexOf('?') !== -1 ? '&' : '?';
      if (url.match(re)) {
        return url.replace(re, '$1' + key + '=' + value + '$2');
      } else {
        return url + sep + key + '=' + value;
      }
    },

    openModal(movieid) {
      const movieCreditsURL = API_BASE_URL + '/movie/' + movieid + '/credits?api_key=' + API_KEY + '&language=en-US';
      const movieURL = API_BASE_URL + '/movie/' + movieid + '?api_key=' + API_KEY + '&language=en-US';
      Promise.all([
        this.getJSON(movieCreditsURL, 'Movie Credits - cannot get the credits'),
        this.getJSON(movieURL, 'Movie Info - cannot get the movie information'),
      ]).then(([credits, details]) => {
        this.renderMovie(details, credits);
      });
    },

    closeModal() {
      this.modalOpen = false;
    },

    renderMovie(details, credits) {
      const { title, overview, backdrop_path, vote_average, release_date, genres, runtime } = details;

      //== get the specific genre data
      const genreData = genres.map((item) => {
        return item.name;
      });

      //== get the specific directors data
      const directors = credits.crew.filter((item) => {
        return item.job === 'Director';
      });

      //== get the specific cast data
      const cast = credits.cast.map((item) => {
        if (item.known_for_department === 'Acting') return item.name;
      });

      let movieSpecifics = '';
      let creditDirs = [];
      let creditCast = cast.slice(0, 3); //== top 3 cast members only

      directors.forEach((item) => {
        creditDirs.push(item.name);
      });

			if (creditDirs.length > 0) this.panelDir = creditDirs.join(', ');
			if (creditCast.length > 0) this.panelCast = creditCast.join(', ')
			if (genreData.length > 0) this.panelGenre = genreData.join(', ')

      const posterImg =
        backdrop_path != null
          ? 'https://image.tmdb.org/t/p/w500' + backdrop_path
          : 'assets/main/img/layout/empty-back.jpg';

      this.panelTitle = title;
      this.panelYear = this.getYear(release_date);
      this.panelTeaser = this.truncateString(overview, 400);
      this.panelRate = vote_average;
      this.panelInfo = movieSpecifics;
			this.posterImg = posterImg;
			this.panelRuntime = runtime;
			this.modalOpen = true;
    },
  },
}).mount('#movie-list');
