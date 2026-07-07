const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

async function getHomepageSettingsFromSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return null;
  }

  const { data, error } = await supabase
    .from('homepage_settings')
    .select('*')
    .eq('id', 'homepage')
    .single();

  if (error) {
    console.error('Supabase fetch error:', error.message || error);
    return null;
  }
  return data || null;
}

async function saveHomepageSettingsToSupabase(settings) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return false;
  }

  const { error } = await supabase
    .from('homepage_settings')
    .upsert({
      id: 'homepage',
      title: settings.title,
      backgroundColor: settings.backgroundColor,
      backgroundImage: settings.backgroundImage,
      backgroundPosition: settings.backgroundPosition
    }, { onConflict: 'id' });

  if (error) {
    console.error('Supabase save error:', error.message || error);
    return false;
  }
  return true;
}

router.get('/homepage', async (req, res) => {
  try {
    const supabaseSettings = await getHomepageSettingsFromSupabase();
    return res.json({ success: true, settings: supabaseSettings || null });
  } catch (error) {
    console.error('Settings GET error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to retrieve homepage settings' });
  }
});

router.post('/homepage', async (req, res) => {
  try {
    const { title, backgroundColor, backgroundImage, backgroundPosition } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const homepageSettings = {
      title,
      backgroundColor: backgroundColor || '#f5f5f5',
      backgroundImage: backgroundImage || '',
      backgroundPosition: backgroundPosition || 'center'
    };

    const savedToSupabase = await saveHomepageSettingsToSupabase(homepageSettings);
    return res.json({ success: true, message: 'Homepage settings saved successfully', settings: homepageSettings, savedToSupabase });
  } catch (error) {
    console.error('Settings POST error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to save homepage settings' });
  }
});

module.exports = router;
