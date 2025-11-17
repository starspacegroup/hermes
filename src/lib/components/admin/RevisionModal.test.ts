import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RevisionModal from './RevisionModal.svelte';
import type { RevisionNode } from '$lib/types/revisions';

describe('RevisionModal - published revision styling', () => {
  const mockRevisions: RevisionNode<unknown>[] = [
    {
      id: 'rev-1',
      site_id: 'site-1',
      entity_type: 'page',
      entity_id: 'page-1',
      revision_hash: 'abc12345',
      parent_revision_id: undefined,
      data: { title: 'Test Page', slug: 'test-page', status: 'published', widgets: [] },
      created_at: Math.floor(Date.now() / 1000) - 3600,
      is_current: true,
      children: [],
      depth: 0,
      branch: 0
    },
    {
      id: 'rev-2',
      site_id: 'site-1',
      entity_type: 'page',
      entity_id: 'page-1',
      revision_hash: 'def67890',
      parent_revision_id: 'rev-1',
      data: { title: 'Test Page', slug: 'test-page', status: 'draft', widgets: [] },
      created_at: Math.floor(Date.now() / 1000) - 1800,
      is_current: false,
      children: [],
      depth: 1,
      branch: 0
    },
    {
      id: 'rev-3',
      site_id: 'site-1',
      entity_type: 'page',
      entity_id: 'page-1',
      revision_hash: 'ghi11111',
      parent_revision_id: 'rev-2',
      data: { title: 'Test Page', slug: 'test-page', status: 'draft', widgets: [] },
      created_at: Math.floor(Date.now() / 1000),
      is_current: false,
      children: [],
      depth: 2,
      branch: 0
    }
  ];

  it('applies published class to published revisions', async () => {
    render(RevisionModal, {
      props: {
        isOpen: true,
        revisions: mockRevisions,
        currentRevisionId: 'rev-2',
        onSelect: vi.fn(),
        onPublish: vi.fn(),
        onClose: vi.fn()
      }
    });

    // Switch to list view to test list-specific features
    const listViewButton = screen.getByTitle('List view');
    await listViewButton.click();

    // Get all revision items
    const revisionItems = document.querySelectorAll('.revision-item');
    expect(revisionItems.length).toBe(3);

    // Check that the published revision has the published class
    const publishedRevision = revisionItems[0];
    expect(publishedRevision.classList.contains('published')).toBe(true);

    // Check that draft revisions don't have the published class
    const draftRevision1 = revisionItems[1];
    const draftRevision2 = revisionItems[2];
    expect(draftRevision1.classList.contains('published')).toBe(false);
    expect(draftRevision2.classList.contains('published')).toBe(false);
  });

  it('applies current class to the current revision', async () => {
    render(RevisionModal, {
      props: {
        isOpen: true,
        revisions: mockRevisions,
        currentRevisionId: 'rev-2',
        onSelect: vi.fn(),
        onPublish: vi.fn(),
        onClose: vi.fn()
      }
    });

    // Switch to list view to test list-specific features
    const listViewButton = screen.getByTitle('List view');
    await listViewButton.click();

    // Get all revision items
    const revisionItems = document.querySelectorAll('.revision-item');

    // Check that the current revision has the current class
    const currentRevision = revisionItems[1]; // rev-2
    expect(currentRevision.classList.contains('current')).toBe(true);

    // Check that other revisions don't have the current class
    const otherRevision1 = revisionItems[0]; // rev-1
    const otherRevision2 = revisionItems[2]; // rev-3
    expect(otherRevision1.classList.contains('current')).toBe(false);
    expect(otherRevision2.classList.contains('current')).toBe(false);
  });

  it('shows "Published" badge for published revisions', () => {
    render(RevisionModal, {
      props: {
        isOpen: true,
        revisions: mockRevisions,
        currentRevisionId: 'rev-2',
        onSelect: vi.fn(),
        onPublish: vi.fn(),
        onClose: vi.fn()
      }
    });

    // Check for published badge (checkmark) in graph view
    const publishedBadges = screen.getAllByText('✓');
    expect(publishedBadges.length).toBe(1);
  });

  it('shows publish button only for draft revisions', async () => {
    render(RevisionModal, {
      props: {
        isOpen: true,
        revisions: mockRevisions,
        currentRevisionId: 'rev-2',
        onSelect: vi.fn(),
        onPublish: vi.fn(),
        onClose: vi.fn()
      }
    });

    // Switch to list view where publish buttons are shown
    const listViewButton = screen.getByTitle('List view');
    await listViewButton.click();

    // Check for publish buttons (should only appear on drafts)
    const publishButtons = screen.getAllByTitle('Make this revision current');
    expect(publishButtons.length).toBe(2); // rev-2 and rev-3 are drafts
  });

  it('does not close modal after publishing a revision', async () => {
    const mockOnPublish = vi.fn();
    const mockOnClose = vi.fn();

    const { container } = render(RevisionModal, {
      props: {
        isOpen: true,
        revisions: mockRevisions,
        currentRevisionId: 'rev-2',
        onSelect: vi.fn(),
        onPublish: mockOnPublish,
        onClose: mockOnClose
      }
    });

    // Switch to list view where publish buttons are shown
    const listViewButton = screen.getByTitle('List view');
    await listViewButton.click();

    // Get publish button for rev-2
    const publishButtons = screen.getAllByTitle('Make this revision current');
    const firstPublishButton = publishButtons[0];

    // Click publish
    await firstPublishButton.click();

    // Verify onPublish was called
    expect(mockOnPublish).toHaveBeenCalledTimes(1);

    // Verify onClose was NOT called (modal stays open to show updated state)
    expect(mockOnClose).not.toHaveBeenCalled();

    // Verify modal is still visible
    const modal = container.querySelector('.modal-overlay');
    expect(modal).toBeInTheDocument();
  });
});
