// src/routes/feedback.js
import express from 'express';

// Create a function that returns the router with Supabase client
const createFeedbackRouter = (supabase) => {
  const router = express.Router();

  // Mock data storage (in a real app, this would be a database)
  let grievances = [];

  // Route to submit a new grievance
  router.post('/submit', async (req, res) => {
    try {
      // Get the grievance data from the request body
      const { user_id, title, description, category } = req.body;

      // Create a new grievance object
      const newGrievance = {
        id: Date.now().toString(),
        user_id,
        title,
        description,
        category,
        status: 'Submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to mock storage
      grievances.push(newGrievance);

      res.status(201).json({
        message: 'Grievance submitted successfully!',
        data: newGrievance
      });

    } catch (error) {
      console.error('Error submitting grievance:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Route to get all grievances for a dashboard
  router.get('/', async (req, res) => {
    try {
      res.status(200).json(grievances);
    } catch (error) {
      console.error('Error fetching grievances:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Route to get a specific grievance by ID
  router.get('/:id', async (req, res) => {
    try {
      const grievance = grievances.find(g => g.id === req.params.id);
      if (!grievance) {
        return res.status(404).json({ error: 'Grievance not found' });
      }
      res.status(200).json(grievance);
    } catch (error) {
      console.error('Error fetching grievance:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Route to update grievance status
  router.put('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const grievance = grievances.find(g => g.id === req.params.id);
      if (!grievance) {
        return res.status(404).json({ error: 'Grievance not found' });
      }

      grievance.status = status;
      grievance.updated_at = new Date().toISOString();

      res.status(200).json({
        message: 'Grievance status updated successfully!',
        data: grievance
      });
    } catch (error) {
      console.error('Error updating grievance status:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

export default createFeedbackRouter;