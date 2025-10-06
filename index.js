// 🌐 Senal YT DL API - Full Updated Version
// 💻 Developed by Mr Senal

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const savetube = require("./savetube");

const app = express();
app.use(cors());

// 🧩 Base info (included in all responses)
const baseInfo = {
  developer: "Mr Senal",
  project: "Senal YT DL",
  version: "2.0",
  message: "Welcome to Senal YT DL 🚀"
};

// 🏠 Root endpoint
app.get("/", (req, res) => {
  res.json({
    ...baseInfo,
    endpoints: {
      search: {
        path: "/search",
        method: "GET",
        description: "Search for YouTube videos",
        parameters: {
          q: "Search query (required)"
        },
        example: "/search?q=music"
      },
      download: {
        path: "/download",
        method: "GET",
        description: "Download YouTube video in any format",
        parameters: {
          id: "YouTube video ID (required)",
          format: "Video quality or mp3 (optional, default: mp3)"
        },
        available_formats: savetube.formats,
        example: "/download?id=dQw4w9WgXcQ&format=720"
      },
      mp3: {
        path: "/mp3",
        method: "GET",
        description: "Quick MP3 download",
        parameters: {
          id: "YouTube video ID (required)"
        },
        example: "/mp3?id=dQw4w9WgXcQ"
      }
    },
    formats: {
      audio: ["mp3"],
      video: ["144", "240", "360", "480", "720", "1080"],
      all: savetube.formats
    }
  });
});

// 🔍 Real-Time Search Endpoint (Tubidy / MP3Juice)
app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ ...baseInfo, error: "Missing search query" });

  try {
    const searchUrl = `https://wwd.mp3juice.blog/search.php?q=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const data = response.data;

    // If API returns JSON
    if (typeof data === "object" && data.items) {
      return res.json({
        ...baseInfo,
        endpoint: "/search",
        query,
        results: data.items.map(v => ({
          title: v.title,
          id: v.id,
          duration: v.duration,
          channel: v.channelTitle,
          source: v.source,
          tubidyURL: `https://tubidy.cv/dl/${encodeURIComponent(v.title)}/${v.id}`
        }))
      });
    }

    // Fallback scrape
    const $ = cheerio.load(data);
    const results = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const title = $(el).text();
      if (href && href.includes("youtube.com")) {
        results.push({ title, url: href });
      }
    });

    res.json({
      ...baseInfo,
      endpoint: "/search",
      query,
      results
    });
  } catch (error) {
    res.status(500).json({
      ...baseInfo,
      endpoint: "/search",
      error: error.message || "Failed to fetch search results"
    });
  }
});

// 🎵 Download Endpoint using Savetube (MP3/MP4)
app.get("/download", async (req, res) => {
  const videoId = req.query.id;
  const format = req.query.format || 'mp3';
  
  if (!videoId) return res.status(400).json({ ...baseInfo, error: "Missing 'id' parameter" });
  if (!savetube.formats.includes(format)) {
    return res.status(400).json({ 
      ...baseInfo, 
      error: "Invalid format", 
      available_formats: savetube.formats 
    });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const result = await savetube.download(videoUrl, format);

    if (!result.status) {
      return res.status(400).json({
        ...baseInfo,
        endpoint: "/download",
        error: result.error || "Failed to download"
      });
    }

    res.json({
      ...baseInfo,
      endpoint: "/download",
      videoId,
      title: result.result.title,
      thumbnail: result.result.thumbnail,
      type: result.result.type,
      format: result.result.format,
      quality: result.result.quality,
      duration: result.result.duration,
      downloadUrl: result.result.download
    });

  } catch (error) {
    res.status(500).json({
      ...baseInfo,
      endpoint: "/download",
      error: error.message || "Failed to convert video"
    });
  }
});

// 🎧 MP3 Download Endpoint (Quick MP3 Download)
app.get("/mp3", async (req, res) => {
  const videoId = req.query.id;
  if (!videoId) return res.status(400).json({ ...baseInfo, error: "Missing 'id'" });

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const result = await savetube.download(videoUrl, 'mp3');

    if (!result.status) {
      return res.status(400).json({
        ...baseInfo,
        endpoint: "/mp3",
        error: result.error || "Failed to download MP3"
      });
    }

    res.json({
      ...baseInfo,
      endpoint: "/mp3",
      videoId,
      title: result.result.title,
      thumbnail: result.result.thumbnail,
      duration: result.result.duration,
      quality: result.result.quality,
      downloadUrl: result.result.download
    });
  } catch (error) {
    res.status(500).json({
      ...baseInfo,
      endpoint: "/mp3",
      error: error.message || "Failed to get MP3"
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Senal YT DL API running on port ${PORT} | Developer: Mr Senal`)
);